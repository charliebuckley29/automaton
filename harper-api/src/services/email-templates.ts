import Handlebars from "handlebars";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPLATES_DIR = resolve(__dirname, "../templates/emails");

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADDRESS =
  process.env.RESEND_FROM_ADDRESS ?? "Harper <harper@yourdomain.com>";

// ---------------------------------------------------------------------------
// Template cache  (Map<templateName, compiled HandlebarsTemplateDelegate>)
// ---------------------------------------------------------------------------

const templateCache = new Map<string, HandlebarsTemplateDelegate>();

// ---------------------------------------------------------------------------
// Custom Handlebars helpers
// ---------------------------------------------------------------------------

/**
 * Returns a hex colour based on a numeric score:
 *   >= 70  → green  (#4CAF50)
 *   >= 40  → amber  (#FF9800)
 *   <  40  → red    (#F44336)
 */
Handlebars.registerHelper("scoreColor", (score: unknown): string => {
  const n = typeof score === "number" ? score : Number(score);
  if (n >= 70) return "#4CAF50";
  if (n >= 40) return "#FF9800";
  return "#F44336";
});

/**
 * Formats an ISO-8601 date string to "12 Mar 2026" style.
 */
Handlebars.registerHelper("formatDate", (isoString: unknown): string => {
  if (typeof isoString !== "string" && !(isoString instanceof Date)) {
    return String(isoString ?? "");
  }
  const d = new Date(isoString as string | Date);
  if (isNaN(d.getTime())) return String(isoString);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
});

/**
 * Formats pence / cents to a currency string.
 * Usage:  {{formatCurrency 4700 "£"}}  →  £47.00
 *         {{formatCurrency 5700 "$"}}  →  $57.00
 * If no symbol provided, defaults to £.
 */
Handlebars.registerHelper(
  "formatCurrency",
  (amountInMinor: unknown, symbol?: unknown): string => {
    const n = typeof amountInMinor === "number" ? amountInMinor : Number(amountInMinor);
    const sym = typeof symbol === "string" ? symbol : "£";
    if (isNaN(n)) return `${sym}0.00`;
    return `${sym}${(n / 100).toFixed(2)}`;
  },
);

/**
 * Block helper for equality comparison.
 * Usage:  {{#ifEquals status "active"}} … {{else}} … {{/ifEquals}}
 */
Handlebars.registerHelper(
  "ifEquals",
  function (this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
    return a === b ? options.fn(this) : options.inverse(this);
  },
);

// ---------------------------------------------------------------------------
// compileTemplate
// ---------------------------------------------------------------------------

/**
 * Reads an HTML template from disk, compiles it with Handlebars, applies
 * the supplied data, and returns the resulting HTML string.
 *
 * Templates are cached after first compilation.
 */
export function compileTemplate(
  templateName: string,
  data: Record<string, unknown>,
): string {
  let compiled = templateCache.get(templateName);

  if (!compiled) {
    const filePath = resolve(TEMPLATES_DIR, `${templateName}.html`);
    const source = readFileSync(filePath, "utf-8");
    compiled = Handlebars.compile(source);
    templateCache.set(templateName, compiled);
  }

  return compiled(data);
}

// ---------------------------------------------------------------------------
// sendTemplatedEmail
// ---------------------------------------------------------------------------

export interface SendTemplatedEmailParams {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

/**
 * Compiles a Handlebars email template and sends it via Resend.
 */
export async function sendTemplatedEmail(
  params: SendTemplatedEmailParams,
): Promise<void> {
  const { to, subject, template, data } = params;
  const html = compileTemplate(template, data);

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  });
}
