import { Router, Request, Response } from "express";
import { supabase } from "../../services/supabase.js";
import { runResearchPipeline } from "../../lib/research.js";
import { requireAuth } from "../../middleware/auth.js";
import { determineInterviewFormat } from "../../lib/intelligence.js";

const router = Router();

// ---------------------------------------------------------------------------
// POST /research/run
// ---------------------------------------------------------------------------

router.post("/run", requireAuth, async (req: Request, res: Response) => {
  try {
    const { session_id } = req.body as { session_id: string };

    if (!session_id) {
      res.status(400).json({ error: "session_id is required" });
      return;
    }

    // Verify the session exists and belongs to the requesting user
    const { data: session, error: sessionError } = await supabase
      .from("report_sessions")
      .select("*, businesses(*)")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // Prevent re-running research if already completed
    if (
      session.status === "research_complete" ||
      session.status === "interviewing"
    ) {
      res.json({
        message: "Research already completed",
        session_id,
        status: session.status,
      });
      return;
    }

    // ------------------------------------------------------------------
    // 1. Update session status → researching
    // ------------------------------------------------------------------

    await supabase
      .from("report_sessions")
      .update({ status: "researching" })
      .eq("id", session_id);

    // ------------------------------------------------------------------
    // 2. Run the research pipeline
    // ------------------------------------------------------------------

    const researchData = await runResearchPipeline(session_id);

    // ------------------------------------------------------------------
    // 3. Respond immediately (pipeline updates session status on its own)
    // ------------------------------------------------------------------

    // ------------------------------------------------------------------
    // 3. Determine interview format for returning businesses
    // ------------------------------------------------------------------

    let interviewFormatResult = null;
    if (session.business_id) {
      interviewFormatResult = await determineInterviewFormat(
        session.business_id,
        session.report_type,
      );

      // Store format in interview state for the voice route to pick up
      await supabase
        .from("voice_interview_state")
        .upsert(
          {
            session_id,
            interview_format: interviewFormatResult.format,
          },
          { onConflict: "session_id" },
        );
    }

    // ------------------------------------------------------------------
    // 4. Respond
    // ------------------------------------------------------------------

    res.json({
      message: "Research pipeline completed",
      session_id,
      interview_format: interviewFormatResult?.format ?? "first_time",
      opening_line: interviewFormatResult?.openingLine ?? "",
      summary: {
        websiteScraped: !!researchData.websiteScrape,
        pageSpeedCollected: !!researchData.pageSpeed,
        briefingGenerated: !!researchData.agentBriefing,
      },
    });
  } catch (err) {
    console.error("[research/run] Error:", err);

    // Attempt to mark session as failed
    const sessionId = (req.body as { session_id?: string }).session_id;
    if (sessionId) {
      await supabase
        .from("report_sessions")
        .update({ status: "research_failed" })
        .eq("id", sessionId)
        .catch(() => {});
    }

    res.status(500).json({ error: "Research pipeline failed" });
  }
});

export default router;
