import { Router, Request, Response } from "express";
import { supabase } from "../../services/supabase.js";
import { sendReportEmail } from "../../services/resend.js";
import { sendTemplatedEmail } from "../../services/email-templates.js";
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

// ---------------------------------------------------------------------------
// POST /email/welcome
// Triggered after account creation. Sends a welcome email via Handlebars.
// ---------------------------------------------------------------------------

router.post("/welcome", async (req: Request, res: Response) => {
  const { to, firstName, dashboardUrl } = req.body as {
    to: string;
    firstName: string;
    dashboardUrl: string;
  };

  if (!to || !firstName) {
    res.status(400).json({ error: "to and firstName are required" });
    return;
  }

  try {
    await sendTemplatedEmail({
      to,
      subject: "Welcome to Harper — let's get started",
      template: "welcome",
      data: {
        firstName,
        dashboardUrl: dashboardUrl ?? "https://app.harper.co/dashboard",
      },
    });

    res.json({ message: "Welcome email sent" });
  } catch (err) {
    console.error("[email/welcome] Error:", err);
    res.status(500).json({ error: "Welcome email failed" });
  }
});

// ---------------------------------------------------------------------------
// POST /email/interview-reminder
// Triggered to remind a user to complete their voice interview.
// ---------------------------------------------------------------------------

router.post("/interview-reminder", async (req: Request, res: Response) => {
  const { to, firstName, businessName, interviewUrl, hoursRemaining } =
    req.body as {
      to: string;
      firstName: string;
      businessName: string;
      interviewUrl: string;
      hoursRemaining: number;
    };

  if (!to || !firstName || !interviewUrl) {
    res
      .status(400)
      .json({ error: "to, firstName, and interviewUrl are required" });
    return;
  }

  try {
    await sendTemplatedEmail({
      to,
      subject: `Your voice interview for ${businessName ?? "your business"} is waiting`,
      template: "interview-reminder",
      data: {
        firstName,
        businessName: businessName ?? "your business",
        interviewUrl,
        hoursRemaining: hoursRemaining ?? 48,
      },
    });

    res.json({ message: "Interview reminder email sent" });
  } catch (err) {
    console.error("[email/interview-reminder] Error:", err);
    res.status(500).json({ error: "Interview reminder email failed" });
  }
});

// ---------------------------------------------------------------------------
// POST /email/upsell-retainer
// Triggered after a report is delivered to upsell retainer services.
// ---------------------------------------------------------------------------

router.post("/upsell-retainer", async (req: Request, res: Response) => {
  const { to, firstName, businessName, topFinding, topOpportunity, retainerUrl, benefits } =
    req.body as {
      to: string;
      firstName: string;
      businessName: string;
      topFinding: string;
      topOpportunity: string;
      retainerUrl: string;
      benefits: string[];
    };

  if (!to || !firstName) {
    res.status(400).json({ error: "to and firstName are required" });
    return;
  }

  try {
    await sendTemplatedEmail({
      to,
      subject: `Next steps for ${businessName ?? "your business"} — Harper Retainer`,
      template: "upsell-retainer",
      data: {
        firstName,
        businessName: businessName ?? "your business",
        topFinding: topFinding ?? "Multiple growth opportunities identified",
        topOpportunity: topOpportunity ?? "Strategic improvements available",
        retainerUrl: retainerUrl ?? "https://app.harper.co/retainer",
        benefits: benefits ?? [
          "Monthly strategy calls with your dedicated analyst",
          "Ongoing competitor and market monitoring",
          "Quarterly updated reports with fresh data",
          "Priority access to new Harper features",
        ],
      },
    });

    res.json({ message: "Upsell retainer email sent" });
  } catch (err) {
    console.error("[email/upsell-retainer] Error:", err);
    res.status(500).json({ error: "Upsell retainer email failed" });
  }
});

// ---------------------------------------------------------------------------
// POST /email/agency-welcome
// Triggered after an agency purchases a bulk pack.
// ---------------------------------------------------------------------------

router.post("/agency-welcome", async (req: Request, res: Response) => {
  const { to, agencyName, creditCount, dashboardUrl, features } =
    req.body as {
      to: string;
      agencyName: string;
      creditCount: number;
      dashboardUrl: string;
      features: string[];
    };

  if (!to || !agencyName) {
    res.status(400).json({ error: "to and agencyName are required" });
    return;
  }

  try {
    await sendTemplatedEmail({
      to,
      subject: `Welcome to Harper — your agency pack is live`,
      template: "agency-welcome",
      data: {
        agencyName,
        creditCount: creditCount ?? 10,
        dashboardUrl: dashboardUrl ?? "https://app.harper.co/agency",
        features: features ?? [
          "Generate reports for any client in minutes",
          "White-label PDF exports with your branding",
          "Centralised billing and credit management",
          "Dedicated agency support channel",
        ],
      },
    });

    res.json({ message: "Agency welcome email sent" });
  } catch (err) {
    console.error("[email/agency-welcome] Error:", err);
    res.status(500).json({ error: "Agency welcome email failed" });
  }
});

export default router;
