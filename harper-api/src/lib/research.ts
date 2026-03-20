import { supabase } from "../services/supabase.js";
import { scrapeWebsite, ScrapedWebsite } from "../services/puppeteer.js";
import { generateBriefing, generateSocialAnalysis } from "../services/claude.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PageSpeedResult {
  performance_score: number | null;
  accessibility_score: number | null;
  best_practices_score: number | null;
  seo_score: number | null;
  first_contentful_paint_ms: number | null;
  largest_contentful_paint_ms: number | null;
  total_blocking_time_ms: number | null;
  cumulative_layout_shift: number | null;
  speed_index_ms: number | null;
}

export interface ResearchData {
  websiteScrape: ScrapedWebsite | null;
  pageSpeed: PageSpeedResult | null;
  socialAnalysis: string | null;
  agentBriefing: string | null;
}

// ---------------------------------------------------------------------------
// PageSpeed Insights API
// ---------------------------------------------------------------------------

const PAGESPEED_API_KEY = process.env.GOOGLE_PAGESPEED_API_KEY;

async function fetchPageSpeedInsights(
  url: string,
): Promise<PageSpeedResult | null> {
  if (!PAGESPEED_API_KEY) {
    console.warn("[research] GOOGLE_PAGESPEED_API_KEY not set — skipping PageSpeed");
    return null;
  }

  try {
    const apiUrl = new URL(
      "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
    );
    apiUrl.searchParams.set("url", url);
    apiUrl.searchParams.set("key", PAGESPEED_API_KEY);
    apiUrl.searchParams.set("category", "PERFORMANCE");
    apiUrl.searchParams.set("category", "ACCESSIBILITY");
    apiUrl.searchParams.set("category", "BEST_PRACTICES");
    apiUrl.searchParams.set("category", "SEO");
    apiUrl.searchParams.set("strategy", "MOBILE");

    const response = await fetch(apiUrl.toString(), {
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      console.error(
        `[research] PageSpeed API returned ${response.status}: ${await response.text()}`,
      );
      return null;
    }

    const data = await response.json();
    const categories = data.lighthouseResult?.categories ?? {};
    const audits = data.lighthouseResult?.audits ?? {};

    return {
      performance_score: categories.performance?.score
        ? Math.round(categories.performance.score * 100)
        : null,
      accessibility_score: categories.accessibility?.score
        ? Math.round(categories.accessibility.score * 100)
        : null,
      best_practices_score: categories["best-practices"]?.score
        ? Math.round(categories["best-practices"].score * 100)
        : null,
      seo_score: categories.seo?.score
        ? Math.round(categories.seo.score * 100)
        : null,
      first_contentful_paint_ms:
        audits["first-contentful-paint"]?.numericValue ?? null,
      largest_contentful_paint_ms:
        audits["largest-contentful-paint"]?.numericValue ?? null,
      total_blocking_time_ms:
        audits["total-blocking-time"]?.numericValue ?? null,
      cumulative_layout_shift:
        audits["cumulative-layout-shift"]?.numericValue ?? null,
      speed_index_ms: audits["speed-index"]?.numericValue ?? null,
    };
  } catch (err) {
    console.error("[research] PageSpeed fetch failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Social / SEO placeholder analysis
// ---------------------------------------------------------------------------

async function analyzeSocialPresence(
  businessName: string,
  websiteUrl: string,
  scrapeData: ScrapedWebsite | null,
): Promise<string | null> {
  // TODO: Integrate real social media APIs (Meta Graph API, LinkedIn, etc.)
  // For now, use Claude to analyze what we can infer from the website scrape

  if (!scrapeData) return null;

  try {
    const prompt = `Analyze the following website data for "${businessName}" (${websiteUrl}) and provide insights about their likely social media presence and online marketing posture.

Website Title: ${scrapeData.title}
Meta Description: ${scrapeData.metaDescription}
Tech Stack Detected: ${scrapeData.techStack.join(", ") || "none detected"}
OG Tags: ${JSON.stringify(scrapeData.ogTags)}

Links found (looking for social links):
${scrapeData.links
  .filter((l) =>
    /facebook|twitter|instagram|linkedin|youtube|tiktok|pinterest/i.test(l.href),
  )
  .map((l) => `- ${l.href} (${l.text})`)
  .join("\n") || "No social media links detected"}

Headings:
${scrapeData.headings.slice(0, 20).join("\n")}

Page content excerpt:
${scrapeData.bodyText.slice(0, 2000)}

Based on this data, provide:
1. What social platforms they appear to be active on
2. Their apparent marketing sophistication level (basic/intermediate/advanced)
3. Tracking and analytics tools detected
4. Content marketing signals
5. Key observations about their digital presence
6. Areas where they may be underinvesting

Keep your response concise — this will be used as part of an agent briefing document.`;

    return await generateSocialAnalysis(prompt);
  } catch (err) {
    console.error("[research] Social analysis failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Agent briefing generation
// ---------------------------------------------------------------------------

/**
 * Calls Claude to synthesize all research data into a concise briefing
 * that the voice agent can reference during the interview.
 */
export async function generateAgentBriefing(
  researchData: Omit<ResearchData, "agentBriefing">,
  intakeData: Record<string, unknown> | null,
): Promise<string> {
  const { websiteScrape, pageSpeed, socialAnalysis } = researchData;

  const systemPrompt = `You are preparing a concise briefing document for Harper, an AI marketing consultant who is about to conduct a voice interview with a business owner.

Your briefing should help Harper:
1. Ask informed, specific questions rather than generic ones
2. Reference specific findings from the research
3. Identify areas that need deeper exploration
4. Understand the business's current marketing sophistication

## Website Scrape Data
${websiteScrape ? JSON.stringify({
    url: websiteScrape.url,
    title: websiteScrape.title,
    metaDescription: websiteScrape.metaDescription,
    techStack: websiteScrape.techStack,
    ogTags: websiteScrape.ogTags,
    headingsSample: websiteScrape.headings.slice(0, 15),
    loadTimeMs: websiteScrape.loadTimeMs,
    linkCount: websiteScrape.links.length,
    contentExcerpt: websiteScrape.bodyText.slice(0, 1500),
  }, null, 2) : "Website scrape unavailable."}

## PageSpeed Insights
${pageSpeed ? JSON.stringify(pageSpeed, null, 2) : "PageSpeed data unavailable."}

## Social/Digital Presence Analysis
${socialAnalysis ?? "Social analysis unavailable."}

## Intake Form Data
${intakeData ? JSON.stringify(intakeData, null, 2) : "No intake data provided."}

Write a briefing of 300-500 words. Use plain language suitable for quick reference. Organize into sections:
- **First Impressions** — headline-level takeaway
- **Website & Tech** — key findings about their site
- **Digital Presence** — what we know about their online marketing
- **Suggested Interview Focus** — 3-5 specific questions or areas to explore based on findings
- **Watch Out For** — potential gaps or red flags to investigate`;

  return await generateBriefing(systemPrompt);
}

// ---------------------------------------------------------------------------
// Main pipeline orchestrator
// ---------------------------------------------------------------------------

/**
 * Runs the full pre-interview research pipeline in parallel, saves results
 * to the database, and generates an agent briefing.
 */
export async function runResearchPipeline(
  sessionId: string,
): Promise<ResearchData> {
  // Load session + business data
  const { data: session, error: sessionError } = await supabase
    .from("report_sessions")
    .select("*, businesses(*)")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const websiteUrl = session.businesses?.website_url;
  const businessName = session.businesses?.name ?? "Unknown Business";

  // ------------------------------------------------------------------
  // Run research tasks in parallel
  // ------------------------------------------------------------------

  const [websiteScrape, pageSpeed] = await Promise.allSettled([
    // Website scraping
    websiteUrl
      ? scrapeWebsite(websiteUrl)
      : Promise.resolve(null),

    // PageSpeed Insights
    websiteUrl
      ? fetchPageSpeedInsights(websiteUrl)
      : Promise.resolve(null),
  ]);

  const scrapeResult =
    websiteScrape.status === "fulfilled" ? websiteScrape.value : null;
  const pageSpeedResult =
    pageSpeed.status === "fulfilled" ? pageSpeed.value : null;

  if (websiteScrape.status === "rejected") {
    console.error("[research] Website scrape failed:", websiteScrape.reason);
  }
  if (pageSpeed.status === "rejected") {
    console.error("[research] PageSpeed failed:", pageSpeed.reason);
  }

  // Social analysis depends on scrape results, so run sequentially
  const socialAnalysis = await analyzeSocialPresence(
    businessName,
    websiteUrl ?? "",
    scrapeResult,
  );

  // ------------------------------------------------------------------
  // Generate agent briefing from all collected data
  // ------------------------------------------------------------------

  const agentBriefing = await generateAgentBriefing(
    {
      websiteScrape: scrapeResult,
      pageSpeed: pageSpeedResult,
      socialAnalysis,
    },
    session.intake_data,
  );

  // ------------------------------------------------------------------
  // Save results to database
  // ------------------------------------------------------------------

  const researchRecord = {
    session_id: sessionId,
    website_scrape: scrapeResult,
    page_speed: pageSpeedResult,
    social_analysis: socialAnalysis,
    agent_briefing: agentBriefing,
    collected_at: new Date().toISOString(),
  };

  const { error: insertError } = await supabase
    .from("research_results")
    .upsert(researchRecord, { onConflict: "session_id" });

  if (insertError) {
    console.error("[research] Failed to save research results:", insertError);
    throw new Error(`Failed to save research results: ${insertError.message}`);
  }

  // ------------------------------------------------------------------
  // Update session status
  // ------------------------------------------------------------------

  await supabase
    .from("report_sessions")
    .update({ status: "research_complete" })
    .eq("id", sessionId);

  // Initialize interview state
  const { determineInterviewFormat } = await import("./interview-state.js");
  const format = await determineInterviewFormat(session.business_id);

  await supabase.from("interview_state").upsert(
    {
      session_id: sessionId,
      areas_covered: [],
      turn_count: 0,
      format,
      key_insights: [],
      flagged_topics: [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "session_id" },
  );

  console.log(
    `[research] Pipeline complete for session ${sessionId} (format: ${format})`,
  );

  return {
    websiteScrape: scrapeResult,
    pageSpeed: pageSpeedResult,
    socialAnalysis,
    agentBriefing,
  };
}
