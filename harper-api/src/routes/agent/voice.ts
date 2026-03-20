import { Router, Request, Response } from "express";
import { supabase } from "../../services/supabase.js";
import { generateInterviewResponse } from "../../services/claude.js";
import {
  updateInterviewState,
  buildInterviewSystemPrompt,
} from "../../lib/interview-state.js";
import { verifyElevenLabs } from "../../middleware/elevenlabs.js";

const router = Router();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface VoiceRequestBody {
  /** ElevenLabs passes a unique id per call */
  conversation_id: string;
  messages: OpenAIMessage[];
}

// ---------------------------------------------------------------------------
// POST /agent/voice
// ---------------------------------------------------------------------------

router.post("/", verifyElevenLabs, async (req: Request, res: Response) => {
  try {
    const { conversation_id, messages } = req.body as VoiceRequestBody;

    if (!conversation_id || !messages?.length) {
      res.status(400).json({ error: "conversation_id and messages are required" });
      return;
    }

    // ------------------------------------------------------------------
    // 1. Resolve session from conversation_id
    // ------------------------------------------------------------------

    const { data: session, error: sessionError } = await supabase
      .from("report_sessions")
      .select("*, businesses(*)")
      .eq("elevenlabs_conversation_id", conversation_id)
      .single();

    if (sessionError || !session) {
      console.error("[voice] Session lookup failed:", sessionError);
      res.status(404).json({ error: "Session not found for conversation_id" });
      return;
    }

    // ------------------------------------------------------------------
    // 2. Load interview state & business intelligence
    // ------------------------------------------------------------------

    const { data: interviewState } = await supabase
      .from("interview_state")
      .select("*")
      .eq("session_id", session.id)
      .single();

    const { data: researchResults } = await supabase
      .from("research_results")
      .select("*")
      .eq("session_id", session.id)
      .single();

    // ------------------------------------------------------------------
    // 3. Persist the latest user turn
    // ------------------------------------------------------------------

    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");

    if (lastUserMessage) {
      await supabase.from("transcript_messages").insert({
        session_id: session.id,
        role: "user",
        content: lastUserMessage.content,
        turn_index: interviewState?.turn_count ?? 0,
      });
    }

    // ------------------------------------------------------------------
    // 4. Build interview system prompt
    // ------------------------------------------------------------------

    const systemPrompt = buildInterviewSystemPrompt({
      businessName: session.businesses?.name ?? "the business",
      businessType: session.businesses?.type ?? "unknown",
      intakeData: session.intake_data,
      researchBriefing: researchResults?.agent_briefing ?? null,
      areasCovered: interviewState?.areas_covered ?? [],
      turnCount: interviewState?.turn_count ?? 0,
      format: interviewState?.format ?? "standard",
    });

    // ------------------------------------------------------------------
    // 5. Call Claude with full context
    // ------------------------------------------------------------------

    // Strip system messages — we provide our own system prompt
    const claudeMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const assistantText = await generateInterviewResponse(
      systemPrompt,
      claudeMessages,
    );

    // ------------------------------------------------------------------
    // 6. Persist assistant turn
    // ------------------------------------------------------------------

    await supabase.from("transcript_messages").insert({
      session_id: session.id,
      role: "assistant",
      content: assistantText,
      turn_index: (interviewState?.turn_count ?? 0) + 1,
    });

    // ------------------------------------------------------------------
    // 7. Update interview state
    // ------------------------------------------------------------------

    await updateInterviewState(session.id, claudeMessages, assistantText);

    // ------------------------------------------------------------------
    // 8. Check for completion signal
    // ------------------------------------------------------------------

    if (assistantText.includes("[INTERVIEW_COMPLETE]")) {
      // Mark session and kick off report generation asynchronously
      await supabase
        .from("report_sessions")
        .update({ status: "generating_report" })
        .eq("id", session.id);

      // Fire-and-forget report generation
      // TODO: Replace with a proper job queue (e.g. BullMQ) in production
      triggerReportGeneration(session.id).catch((err) =>
        console.error("[voice] Background report generation failed:", err),
      );
    }

    // ------------------------------------------------------------------
    // 9. Return OpenAI-compatible response
    // ------------------------------------------------------------------

    // Strip the completion signal from the spoken response
    const spokenText = assistantText.replace("[INTERVIEW_COMPLETE]", "").trim();

    res.json({
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "harper-voice",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: spokenText,
          },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    });
  } catch (err) {
    console.error("[voice] Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Trigger report generation for a completed interview.
 * Calls the reports endpoint internally.
 */
async function triggerReportGeneration(sessionId: string): Promise<void> {
  const baseUrl = process.env.API_BASE_URL ?? `http://localhost:${process.env.PORT ?? "8080"}`;

  const response = await fetch(`${baseUrl}/reports/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Report generation failed (${response.status}): ${body}`);
  }
}

export default router;
