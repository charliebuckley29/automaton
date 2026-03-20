/**
 * DataForSEO service.
 * Provides SEO visibility data during the research phase.
 */

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;
const DATAFORSEO_BASE_URL = "https://api.dataforseo.com/v3";

if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
  console.warn("[dataforseo] Credentials not set — SEO research will use fallback");
}

function getAuthHeader(): string {
  return `Basic ${Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString("base64")}`;
}

async function dataForSeoFetch(path: string, body: unknown): Promise<unknown> {
  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    return null;
  }

  const res = await fetch(`${DATAFORSEO_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[dataforseo] ${path} failed:`, text);
    return null;
  }

  return res.json();
}

interface DomainOverview {
  organicTraffic: number;
  organicKeywords: number;
  backlinks: number;
  referringDomains: number;
  domainRank: number;
}

/**
 * Get domain overview metrics.
 */
export async function getDomainOverview(
  domain: string,
  locationCode: number = 2826, // UK default
): Promise<DomainOverview | null> {
  try {
    const result = (await dataForSeoFetch(
      "/dataforseo_labs/google/domain_rank_overview/live",
      [{ target: domain, location_code: locationCode }],
    )) as {
      tasks?: Array<{
        result?: Array<{
          items?: Array<{
            organic_etv?: number;
            organic_count?: number;
            backlinks?: number;
            referring_domains?: number;
            rank?: number;
          }>;
        }>;
      }>;
    } | null;

    const item = result?.tasks?.[0]?.result?.[0]?.items?.[0];
    if (!item) return null;

    return {
      organicTraffic: item.organic_etv ?? 0,
      organicKeywords: item.organic_count ?? 0,
      backlinks: item.backlinks ?? 0,
      referringDomains: item.referring_domains ?? 0,
      domainRank: item.rank ?? 0,
    };
  } catch (err) {
    console.error("[dataforseo] getDomainOverview error:", err);
    return null;
  }
}

interface KeywordData {
  keyword: string;
  position: number;
  searchVolume: number;
  url: string;
}

/**
 * Get top ranking keywords for a domain.
 */
export async function getRankedKeywords(
  domain: string,
  locationCode: number = 2826,
  limit: number = 20,
): Promise<KeywordData[]> {
  try {
    const result = (await dataForSeoFetch(
      "/dataforseo_labs/google/ranked_keywords/live",
      [
        {
          target: domain,
          location_code: locationCode,
          limit,
          order_by: ["keyword_data.keyword_info.search_volume,desc"],
        },
      ],
    )) as {
      tasks?: Array<{
        result?: Array<{
          items?: Array<{
            keyword_data?: {
              keyword?: string;
              keyword_info?: { search_volume?: number };
            };
            ranked_serp_element?: { serp_item?: { rank_absolute?: number; url?: string } };
          }>;
        }>;
      }>;
    } | null;

    const items = result?.tasks?.[0]?.result?.[0]?.items;
    if (!items) return [];

    return items.map((item) => ({
      keyword: item.keyword_data?.keyword ?? "",
      position: item.ranked_serp_element?.serp_item?.rank_absolute ?? 0,
      searchVolume: item.keyword_data?.keyword_info?.search_volume ?? 0,
      url: item.ranked_serp_element?.serp_item?.url ?? "",
    }));
  } catch (err) {
    console.error("[dataforseo] getRankedKeywords error:", err);
    return [];
  }
}

/**
 * Get competitor domains for a target.
 */
export async function getCompetitors(
  domain: string,
  locationCode: number = 2826,
  limit: number = 10,
): Promise<Array<{ domain: string; rank: number; overlap: number }>> {
  try {
    const result = (await dataForSeoFetch(
      "/dataforseo_labs/google/competitors_domain/live",
      [{ target: domain, location_code: locationCode, limit }],
    )) as {
      tasks?: Array<{
        result?: Array<{
          items?: Array<{
            domain?: string;
            avg_position?: number;
            intersections?: number;
          }>;
        }>;
      }>;
    } | null;

    const items = result?.tasks?.[0]?.result?.[0]?.items;
    if (!items) return [];

    return items.map((item) => ({
      domain: item.domain ?? "",
      rank: Math.round(item.avg_position ?? 0),
      overlap: item.intersections ?? 0,
    }));
  } catch (err) {
    console.error("[dataforseo] getCompetitors error:", err);
    return [];
  }
}
