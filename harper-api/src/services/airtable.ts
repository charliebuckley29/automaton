/**
 * Airtable CRM service.
 * Syncs contacts, deals, and report data to Airtable for pipeline management.
 */

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_BASE_URL = "https://api.airtable.com/v0";

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.warn("[airtable] Credentials not set — CRM sync will be skipped");
}

async function airtableFetch(
  table: string,
  method: "GET" | "POST" | "PATCH",
  body?: unknown,
  params?: Record<string, string>,
): Promise<unknown> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return null;
  }

  const url = new URL(`${AIRTABLE_BASE_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[airtable] ${method} ${table} failed:`, text);
    return null;
  }

  return res.json();
}

/**
 * Find a contact by email. Returns the Airtable record ID or null.
 */
export async function findContact(email: string): Promise<string | null> {
  const result = (await airtableFetch("Contacts", "GET", undefined, {
    filterByFormula: `{Email} = "${email}"`,
    maxRecords: "1",
  })) as { records?: Array<{ id: string }> } | null;

  return result?.records?.[0]?.id ?? null;
}

/**
 * Create or update a contact in the CRM.
 */
export async function syncContact(params: {
  email: string;
  fullName?: string;
  businessName?: string;
  businessType?: string;
  country?: string;
  source?: string;
  status?: string;
  totalSpend?: number;
}): Promise<string | null> {
  try {
    const existingId = await findContact(params.email);

    const fields: Record<string, unknown> = {
      Email: params.email,
      ...(params.fullName && { Name: params.fullName }),
      ...(params.businessName && { Business: params.businessName }),
      ...(params.businessType && { Type: params.businessType }),
      ...(params.country && { Country: params.country }),
      ...(params.source && { Source: params.source }),
      ...(params.status && { Status: params.status }),
      ...(params.totalSpend !== undefined && { "Total Spend": params.totalSpend }),
      "Last Activity": new Date().toISOString().split("T")[0],
    };

    if (existingId) {
      await airtableFetch("Contacts", "PATCH", {
        records: [{ id: existingId, fields }],
      });
      return existingId;
    }

    const result = (await airtableFetch("Contacts", "POST", {
      records: [{ fields }],
    })) as { records?: Array<{ id: string }> } | null;

    return result?.records?.[0]?.id ?? null;
  } catch (err) {
    console.error("[airtable] syncContact error:", err);
    return null;
  }
}

/**
 * Log a deal/purchase in Airtable.
 */
export async function syncDeal(params: {
  contactEmail: string;
  serviceType: string;
  value: number;
  currency: string;
  status: string;
  notes?: string;
}): Promise<void> {
  try {
    const contactId = await findContact(params.contactEmail);

    await airtableFetch("Deals", "POST", {
      records: [
        {
          fields: {
            ...(contactId && { Contact: [contactId] }),
            "Service Type": params.serviceType,
            Value: params.value,
            Currency: params.currency,
            Status: params.status,
            ...(params.notes && { Notes: params.notes }),
            Date: new Date().toISOString().split("T")[0],
          },
        },
      ],
    });
  } catch (err) {
    console.error("[airtable] syncDeal error:", err);
  }
}

/**
 * Sync a completed report to Airtable.
 */
export async function syncReport(params: {
  contactEmail: string;
  reportType: string;
  overallScore: number;
  reportDate: string;
  upsellStatus?: string;
}): Promise<void> {
  try {
    const contactId = await findContact(params.contactEmail);

    await airtableFetch("Reports", "POST", {
      records: [
        {
          fields: {
            ...(contactId && { Contact: [contactId] }),
            Type: params.reportType,
            Score: params.overallScore,
            Date: params.reportDate,
            ...(params.upsellStatus && { "Upsell Status": params.upsellStatus }),
          },
        },
      ],
    });
  } catch (err) {
    console.error("[airtable] syncReport error:", err);
  }
}
