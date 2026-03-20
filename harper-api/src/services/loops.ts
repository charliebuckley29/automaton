/**
 * Loops email sequence service.
 * Triggers automated email sequences for lead nurture and post-report upsells.
 */

const LOOPS_API_KEY = process.env.LOOPS_API_KEY;
const LOOPS_BASE_URL = "https://app.loops.so/api/v1";

if (!LOOPS_API_KEY) {
  console.warn("[loops] LOOPS_API_KEY not set — email sequences will be skipped");
}

interface LoopsContact {
  email: string;
  firstName?: string;
  lastName?: string;
  source?: string;
  userGroup?: string;
  [key: string]: string | number | boolean | undefined;
}

interface LoopsEventPayload {
  email: string;
  eventName: string;
  eventProperties?: Record<string, string | number | boolean>;
}

async function loopsFetch(path: string, body: unknown): Promise<Response> {
  if (!LOOPS_API_KEY) {
    throw new Error("Loops API key not configured");
  }

  return fetch(`${LOOPS_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOOPS_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Create or update a contact in Loops.
 */
export async function upsertLoopsContact(contact: LoopsContact): Promise<void> {
  try {
    const res = await loopsFetch("/contacts/update", {
      ...contact,
      mailingLists: {},
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[loops] Failed to upsert contact:", text);
    }
  } catch (err) {
    console.error("[loops] Contact upsert error:", err);
  }
}

/**
 * Send a transactional event to trigger a Loops sequence.
 */
export async function sendLoopsEvent(payload: LoopsEventPayload): Promise<void> {
  try {
    const res = await loopsFetch("/events/send", {
      email: payload.email,
      eventName: payload.eventName,
      eventProperties: payload.eventProperties ?? {},
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[loops] Failed to send event:", text);
    }
  } catch (err) {
    console.error("[loops] Event send error:", err);
  }
}

/**
 * Trigger the post-report upsell sequence (5 emails over 14 days).
 */
export async function triggerReportUpsellSequence(params: {
  email: string;
  businessName: string;
  reportType: string;
  headlineFinding: string;
  topOpportunity: string;
  recommendedNextStep: string;
  overallScore: number;
}): Promise<void> {
  await sendLoopsEvent({
    email: params.email,
    eventName: "report_delivered",
    eventProperties: {
      businessName: params.businessName,
      reportType: params.reportType,
      headlineFinding: params.headlineFinding,
      topOpportunity: params.topOpportunity,
      recommendedNextStep: params.recommendedNextStep,
      overallScore: params.overallScore,
    },
  });
}

/**
 * Trigger the free scorecard lead nurture sequence (6 emails over 14 days).
 */
export async function triggerScorecardSequence(params: {
  email: string;
  fullName: string;
  businessName: string;
  scorecardScore: number;
  topRecommendations: string;
}): Promise<void> {
  await upsertLoopsContact({
    email: params.email,
    firstName: params.fullName.split(" ")[0],
    source: "scorecard",
    userGroup: "lead",
    scorecardScore: params.scorecardScore,
    businessName: params.businessName,
  });

  await sendLoopsEvent({
    email: params.email,
    eventName: "scorecard_completed",
    eventProperties: {
      businessName: params.businessName,
      scorecardScore: params.scorecardScore,
      topRecommendations: params.topRecommendations,
    },
  });
}
