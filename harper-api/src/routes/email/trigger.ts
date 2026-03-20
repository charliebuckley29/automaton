import { Router, Request, Response } from "express";
import { supabase } from "../../services/supabase.js";
import { sendReportEmail } from "../../services/resend.js";
import { triggerReportUpsellSequence, triggerScorecardSequence } from "../../services/loops.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

// ---------------------------------------------------------------------------
// POST /email/report-delivered
// Triggered after a report is generated. Sends the report email via Resend
// and starts the upsell sequence in Loops.
// ---------------------------------------------------------------------------

router.post("/report-delivered", async (req: Request, res: Response) => {
  const { report_id } = req.body as { report_id: string };

  if (!report_id) {
    res.status(400).json({ error: "report_id is required" });
    return;
  }

  try {
    const { data: report, error } = await supabase
      .from("reports")
      .select(`
        *,
        report_sessions(
          *,
          businesses(*)
        )
      `)
      .eq("id", report_id)
      .single();

    if (error || !report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    const session = report.report_sessions;
    const business = session?.businesses;
    const customerEmail = business?.contact_email ?? session?.customer_email;

    if (!customerEmail) {
      res.status(400).json({ error: "No customer email found" });
      return;
    }

    // 1. Send transactional report email via Resend
    try {
      await sendReportEmail(
        customerEmail,
        report.pdf_url,
        business?.name ?? "your business",
      );

      await supabase
        .from("reports")
        .update({ emailed_at: new Date().toISOString() })
        .eq("id", report_id);
    } catch (emailErr) {
      console.error("[email/report-delivered] Resend failed:", emailErr);
    }

    // 2. Start upsell sequence in Loops
    const analysisJson = report.report_json ?? report.analysis_json;
    try {
      await triggerReportUpsellSequence({
        email: customerEmail,
        businessName: business?.name ?? "Unknown",
        reportType: report.report_type ?? session?.report_type ?? "business_intelligence",
        headlineFinding: analysisJson?.headline_finding ?? analysisJson?.executive_summary ?? "",
        topOpportunity: analysisJson?.opportunities?.[0]?.title ?? "",
        recommendedNextStep: analysisJson?.recommended_next_step?.type ?? "",
        overallScore: report.score_overall ?? analysisJson?.scores?.overall ?? 0,
      });
    } catch (loopsErr) {
      console.error("[email/report-delivered] Loops sequence failed:", loopsErr);
    }

    res.json({ message: "Report delivery emails triggered" });
  } catch (err) {
    console.error("[email/report-delivered] Error:", err);
    res.status(500).json({ error: "Email trigger failed" });
  }
});

// ---------------------------------------------------------------------------
// POST /email/scorecard-completed
// Triggered after a free scorecard is completed.
// ---------------------------------------------------------------------------

router.post("/scorecard-completed", async (req: Request, res: Response) => {
  const { lead_id } = req.body as { lead_id: string };

  if (!lead_id) {
    res.status(400).json({ error: "lead_id is required" });
    return;
  }

  try {
    const { data: lead, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (error || !lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    await triggerScorecardSequence({
      email: lead.email,
      fullName: lead.full_name ?? "",
      businessName: lead.business_name ?? "",
      scorecardScore: lead.scorecard_score ?? 0,
      topRecommendations: JSON.stringify(
        lead.scorecard_answers?.recommendations?.slice(0, 3) ?? [],
      ),
    });

    // Update lead status
    await supabase
      .from("leads")
      .update({ status: "sequenced" })
      .eq("id", lead_id);

    res.json({ message: "Scorecard sequence triggered" });
  } catch (err) {
    console.error("[email/scorecard-completed] Error:", err);
    res.status(500).json({ error: "Scorecard email trigger failed" });
  }
});

// ---------------------------------------------------------------------------
// POST /email/send-custom
// Send a one-off transactional email via Resend (e.g. payment recovery).
// ---------------------------------------------------------------------------

router.post("/send-custom", requireAuth, async (req: Request, res: Response) => {
  const { to, subject, html_body } = req.body as {
    to: string;
    subject: string;
    html_body: string;
  };

  if (!to || !subject || !html_body) {
    res.status(400).json({ error: "to, subject, and html_body are required" });
    return;
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: process.env.RESEND_FROM_ADDRESS ?? "Harper <harper@yourdomain.com>",
      to,
      subject,
      html: html_body,
    });

    res.json({ message: "Email sent" });
  } catch (err) {
    console.error("[email/send-custom] Error:", err);
    res.status(500).json({ error: "Email send failed" });
  }
});

export default router;
