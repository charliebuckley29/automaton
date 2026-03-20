import { Router, Request, Response } from "express";
import { supabase } from "../../services/supabase.js";
import { generateReportAnalysis } from "../../services/claude.js";
import { generatePdf } from "../../services/puppeteer.js";
import { sendReportEmail } from "../../services/resend.js";

const router = Router();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportAnalysis {
  executive_summary: string;
  current_state: {
    website_assessment: string;
    seo_analysis: string;
    social_media_presence: string;
    brand_consistency: string;
  };
  recommendations: Array<{
    title: string;
    priority: "high" | "medium" | "low";
    description: string;
    estimated_impact: string;
    implementation_steps: string[];
  }>;
  competitive_landscape: string;
  quick_wins: string[];
  long_term_strategy: string;
  scorecard: Record<string, number>;
}

// ---------------------------------------------------------------------------
// POST /reports/generate
// ---------------------------------------------------------------------------

router.post("/generate", async (req: Request, res: Response) => {
  const { session_id } = req.body as { session_id: string };

  if (!session_id) {
    res.status(400).json({ error: "session_id is required" });
    return;
  }

  try {
    // ----------------------------------------------------------------
    // 1. Load session and all related data
    // ----------------------------------------------------------------

    const { data: session, error: sessionError } = await supabase
      .from("report_sessions")
      .select("*, businesses(*)")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // Prevent duplicate generation
    if (session.status === "complete") {
      const { data: existingReport } = await supabase
        .from("reports")
        .select("id, pdf_url")
        .eq("session_id", session_id)
        .single();

      if (existingReport) {
        res.json({
          message: "Report already generated",
          report_id: existingReport.id,
          pdf_url: existingReport.pdf_url,
        });
        return;
      }
    }

    // Update status
    await supabase
      .from("report_sessions")
      .update({ status: "generating_report" })
      .eq("id", session_id);

    // Load transcript
    const { data: transcript } = await supabase
      .from("transcript_messages")
      .select("*")
      .eq("session_id", session_id)
      .order("turn_index", { ascending: true });

    // Load research results
    const { data: research } = await supabase
      .from("research_results")
      .select("*")
      .eq("session_id", session_id)
      .single();

    // Load prior interactions for this business (for returning customers)
    const { data: priorSessions } = await supabase
      .from("report_sessions")
      .select("id, created_at, status")
      .eq("business_id", session.business_id)
      .eq("status", "complete")
      .neq("id", session_id)
      .order("created_at", { ascending: false })
      .limit(5);

    let priorReports: Array<{ created_at: string; executive_summary: string }> = [];
    if (priorSessions && priorSessions.length > 0) {
      const { data } = await supabase
        .from("reports")
        .select("session_id, created_at, analysis_json")
        .in(
          "session_id",
          priorSessions.map((s) => s.id),
        );
      priorReports =
        data?.map((r) => ({
          created_at: r.created_at,
          executive_summary:
            (r.analysis_json as ReportAnalysis)?.executive_summary ?? "",
        })) ?? [];
    }

    // ----------------------------------------------------------------
    // 2. Build analysis prompt and call Claude
    // ----------------------------------------------------------------

    const transcriptText = (transcript ?? [])
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const systemPrompt = buildAnalysisSystemPrompt({
      businessName: session.businesses?.name ?? "Unknown Business",
      businessType: session.businesses?.type ?? "unknown",
      intakeData: session.intake_data,
      research: research,
      priorReports,
    });

    const analysisRaw = await generateReportAnalysis(systemPrompt, [
      {
        role: "user",
        content: `Here is the full interview transcript:\n\n${transcriptText}\n\nPlease analyze this conversation along with the research data and produce the full report analysis as a JSON object.`,
      },
    ]);

    // ----------------------------------------------------------------
    // 3. Parse JSON response
    // ----------------------------------------------------------------

    let analysis: ReportAnalysis;
    try {
      // Claude may wrap the JSON in markdown code fences
      const jsonMatch = analysisRaw.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : analysisRaw.trim();
      analysis = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("[reports/generate] Failed to parse analysis JSON:", parseErr);
      console.error("[reports/generate] Raw response:", analysisRaw.slice(0, 500));

      await supabase
        .from("report_sessions")
        .update({ status: "generation_failed" })
        .eq("id", session_id);

      res.status(500).json({ error: "Failed to parse report analysis" });
      return;
    }

    // ----------------------------------------------------------------
    // 4. Render HTML from template
    // ----------------------------------------------------------------

    const reportHtml = renderReportHtml(
      analysis,
      session.businesses?.name ?? "Unknown Business",
      session.businesses?.website_url ?? "",
    );

    // ----------------------------------------------------------------
    // 5. Generate PDF
    // ----------------------------------------------------------------

    const pdfBuffer = await generatePdf(reportHtml);

    // ----------------------------------------------------------------
    // 6. Upload PDF to Supabase Storage
    // ----------------------------------------------------------------

    const pdfFileName = `reports/${session.business_id}/${session_id}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("reports")
      .upload(pdfFileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("[reports/generate] PDF upload failed:", uploadError);
      throw new Error(`PDF upload failed: ${uploadError.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("reports").getPublicUrl(pdfFileName);

    // ----------------------------------------------------------------
    // 7. Create report record
    // ----------------------------------------------------------------

    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        session_id,
        business_id: session.business_id,
        analysis_json: analysis,
        html_content: reportHtml,
        pdf_url: publicUrl,
        status: "complete",
      })
      .select()
      .single();

    if (reportError) {
      console.error("[reports/generate] Failed to create report record:", reportError);
      throw new Error(`Report record creation failed: ${reportError.message}`);
    }

    // ----------------------------------------------------------------
    // 8. Update session status
    // ----------------------------------------------------------------

    await supabase
      .from("report_sessions")
      .update({ status: "complete", completed_at: new Date().toISOString() })
      .eq("id", session_id);

    // ----------------------------------------------------------------
    // 9. Trigger email delivery
    // ----------------------------------------------------------------

    const customerEmail =
      session.businesses?.contact_email ?? session.customer_email;

    if (customerEmail) {
      try {
        await sendReportEmail(
          customerEmail,
          publicUrl,
          session.businesses?.name ?? "your business",
        );

        await supabase
          .from("reports")
          .update({ email_sent_at: new Date().toISOString() })
          .eq("id", report.id);
      } catch (emailErr) {
        // Non-fatal: report is generated, just email delivery failed
        console.error("[reports/generate] Email delivery failed:", emailErr);
      }
    }

    // ----------------------------------------------------------------
    // 10. Respond
    // ----------------------------------------------------------------

    res.json({
      message: "Report generated successfully",
      report_id: report.id,
      pdf_url: publicUrl,
      session_id,
    });
  } catch (err) {
    console.error("[reports/generate] Unhandled error:", err);

    await supabase
      .from("report_sessions")
      .update({ status: "generation_failed" })
      .eq("id", session_id)
      .catch(() => {});

    res.status(500).json({ error: "Report generation failed" });
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildAnalysisSystemPrompt(params: {
  businessName: string;
  businessType: string;
  intakeData: Record<string, unknown> | null;
  research: Record<string, unknown> | null;
  priorReports: Array<{ created_at: string; executive_summary: string }>;
}): string {
  const { businessName, businessType, intakeData, research, priorReports } =
    params;

  let prompt = `You are Harper, an expert marketing analyst. You are generating a comprehensive marketing analysis report for "${businessName}" (${businessType}).

Your task is to analyze the interview transcript along with the research data provided and produce a structured JSON report.

## Research Data
${research ? JSON.stringify(research, null, 2) : "No research data available."}

## Intake Information
${intakeData ? JSON.stringify(intakeData, null, 2) : "No intake data available."}
`;

  if (priorReports.length > 0) {
    prompt += `
## Prior Report Summaries (for context on progress)
${priorReports.map((r) => `- ${r.created_at}: ${r.executive_summary}`).join("\n")}
`;
  }

  prompt += `
## Output Format

Respond with ONLY a valid JSON object matching this structure (no markdown, no extra text):

{
  "executive_summary": "2-3 paragraph overview",
  "current_state": {
    "website_assessment": "detailed website analysis",
    "seo_analysis": "SEO findings and opportunities",
    "social_media_presence": "social media evaluation",
    "brand_consistency": "brand consistency assessment"
  },
  "recommendations": [
    {
      "title": "Recommendation title",
      "priority": "high|medium|low",
      "description": "Detailed description",
      "estimated_impact": "Expected business impact",
      "implementation_steps": ["Step 1", "Step 2"]
    }
  ],
  "competitive_landscape": "Competitive analysis summary",
  "quick_wins": ["Quick win 1", "Quick win 2"],
  "long_term_strategy": "6-12 month strategic roadmap",
  "scorecard": {
    "website": 1-10,
    "seo": 1-10,
    "social_media": 1-10,
    "content": 1-10,
    "brand": 1-10,
    "overall": 1-10
  }
}

Be specific, actionable, and honest. Reference actual findings from the research data and interview. Do not make up data — if information is unavailable, say so.`;

  return prompt;
}

/**
 * Render the report analysis into a styled HTML document.
 * TODO: Move this to a proper templating engine (e.g. Handlebars) for easier
 * design iteration.
 */
function renderReportHtml(
  analysis: ReportAnalysis,
  businessName: string,
  websiteUrl: string,
): string {
  const scoreEntries = Object.entries(analysis.scorecard ?? {});
  const scoreCardsHtml = scoreEntries
    .map(
      ([key, value]) => `
      <div class="score-card">
        <div class="score-value">${value}</div>
        <div class="score-label">${key.replace(/_/g, " ")}</div>
      </div>`,
    )
    .join("");

  const recommendationsHtml = (analysis.recommendations ?? [])
    .map(
      (rec) => `
      <div class="recommendation ${rec.priority}">
        <div class="rec-header">
          <h3>${rec.title}</h3>
          <span class="priority-badge">${rec.priority}</span>
        </div>
        <p>${rec.description}</p>
        <p><strong>Expected impact:</strong> ${rec.estimated_impact}</p>
        <ol>
          ${(rec.implementation_steps ?? []).map((s) => `<li>${s}</li>`).join("")}
        </ol>
      </div>`,
    )
    .join("");

  const quickWinsHtml = (analysis.quick_wins ?? [])
    .map((w) => `<li>${w}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Harper Report — ${businessName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1a1a2e; line-height: 1.6; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 3px solid #6c63ff; }
    .header h1 { font-size: 28px; color: #6c63ff; margin-bottom: 8px; }
    .header .subtitle { color: #666; font-size: 14px; }
    h2 { font-size: 20px; color: #1a1a2e; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0; }
    .executive-summary { background: #f8f8ff; padding: 24px; border-radius: 8px; margin-bottom: 32px; border-left: 4px solid #6c63ff; }
    .scorecard { display: flex; flex-wrap: wrap; gap: 16px; margin: 24px 0; }
    .score-card { flex: 1; min-width: 120px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; text-align: center; }
    .score-value { font-size: 32px; font-weight: 700; color: #6c63ff; }
    .score-label { font-size: 12px; text-transform: uppercase; color: #666; margin-top: 4px; }
    .recommendation { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
    .recommendation.high { border-left: 4px solid #e74c3c; }
    .recommendation.medium { border-left: 4px solid #f39c12; }
    .recommendation.low { border-left: 4px solid #2ecc71; }
    .rec-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .rec-header h3 { font-size: 16px; }
    .priority-badge { font-size: 11px; text-transform: uppercase; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
    .high .priority-badge { background: #fde8e8; color: #e74c3c; }
    .medium .priority-badge { background: #fef5e7; color: #f39c12; }
    .low .priority-badge { background: #e8f8f5; color: #2ecc71; }
    ol, ul { padding-left: 20px; margin-top: 8px; }
    li { margin-bottom: 4px; }
    .section-content { margin-bottom: 24px; }
    .footer { text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Marketing Analysis Report</h1>
    <div class="subtitle">${businessName}${websiteUrl ? ` &mdash; ${websiteUrl}` : ""}</div>
    <div class="subtitle">Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
  </div>

  <div class="executive-summary">
    <h2 style="margin-top: 0; border: none;">Executive Summary</h2>
    <p>${analysis.executive_summary ?? ""}</p>
  </div>

  <h2>Scorecard</h2>
  <div class="scorecard">${scoreCardsHtml}</div>

  <h2>Current State Assessment</h2>
  <div class="section-content">
    <h3>Website</h3>
    <p>${analysis.current_state?.website_assessment ?? ""}</p>
    <h3 style="margin-top: 16px;">SEO</h3>
    <p>${analysis.current_state?.seo_analysis ?? ""}</p>
    <h3 style="margin-top: 16px;">Social Media</h3>
    <p>${analysis.current_state?.social_media_presence ?? ""}</p>
    <h3 style="margin-top: 16px;">Brand Consistency</h3>
    <p>${analysis.current_state?.brand_consistency ?? ""}</p>
  </div>

  <h2>Recommendations</h2>
  ${recommendationsHtml}

  <h2>Quick Wins</h2>
  <ul>${quickWinsHtml}</ul>

  <h2>Competitive Landscape</h2>
  <div class="section-content">
    <p>${analysis.competitive_landscape ?? ""}</p>
  </div>

  <h2>Long-Term Strategy</h2>
  <div class="section-content">
    <p>${analysis.long_term_strategy ?? ""}</p>
  </div>

  <div class="footer">
    <p>Generated by Harper &mdash; AI-Powered Marketing Intelligence</p>
  </div>
</body>
</html>`;
}

export default router;
