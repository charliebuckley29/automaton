import puppeteer, { Browser } from "puppeteer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScrapedWebsite {
  url: string;
  title: string;
  metaDescription: string;
  headings: string[];
  bodyText: string;
  links: { href: string; text: string }[];
  techStack: string[];
  ogTags: Record<string, string>;
  loadTimeMs: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!_browser || !_browser.connected) {
    _browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
  }
  return _browser;
}

// ---------------------------------------------------------------------------
// Scrape a website
// ---------------------------------------------------------------------------

/**
 * Launches a headless browser, navigates to `url`, and extracts page
 * content, metadata, and inferred tech-stack signals.
 */
export async function scrapeWebsite(url: string): Promise<ScrapedWebsite> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (compatible; HarperBot/1.0; +https://harper.ai)",
  );
  await page.setViewport({ width: 1440, height: 900 });

  const startTime = Date.now();

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30_000 });
  } catch {
    // If networkidle2 times out, try domcontentloaded as fallback
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 });
  }

  const loadTimeMs = Date.now() - startTime;

  const data = await page.evaluate(() => {
    const getMeta = (name: string): string =>
      (
        document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement
      )?.content ?? "";

    const getOg = (property: string): string =>
      (
        document.querySelector(
          `meta[property="og:${property}"]`,
        ) as HTMLMetaElement
      )?.content ?? "";

    // Collect headings
    const headings = Array.from(
      document.querySelectorAll("h1, h2, h3"),
    ).map((el) => el.textContent?.trim() ?? "");

    // Collect links
    const links = Array.from(document.querySelectorAll("a[href]"))
      .slice(0, 100)
      .map((a) => ({
        href: (a as HTMLAnchorElement).href,
        text: a.textContent?.trim() ?? "",
      }));

    // Body text (first 5000 chars)
    const bodyText =
      document.body?.innerText?.slice(0, 5000) ?? "";

    // Tech-stack detection heuristics
    const techStack: string[] = [];
    const html = document.documentElement.outerHTML;

    if (html.includes("wp-content") || html.includes("wordpress"))
      techStack.push("WordPress");
    if (html.includes("shopify")) techStack.push("Shopify");
    if (html.includes("squarespace")) techStack.push("Squarespace");
    if (html.includes("wix.com")) techStack.push("Wix");
    if (html.includes("__next")) techStack.push("Next.js");
    if (html.includes("gatsby")) techStack.push("Gatsby");
    if (html.includes("react")) techStack.push("React");
    if (html.includes("vue")) techStack.push("Vue");
    if (html.includes("bootstrap")) techStack.push("Bootstrap");
    if (html.includes("tailwind")) techStack.push("Tailwind CSS");
    if (html.includes("gtag") || html.includes("google-analytics"))
      techStack.push("Google Analytics");
    if (html.includes("fbq(")) techStack.push("Facebook Pixel");
    if (html.includes("hotjar")) techStack.push("Hotjar");

    // OG tags
    const ogTags: Record<string, string> = {};
    for (const prop of ["title", "description", "image", "url", "type"]) {
      const val = getOg(prop);
      if (val) ogTags[prop] = val;
    }

    return {
      title: document.title,
      metaDescription: getMeta("description"),
      headings,
      bodyText,
      links,
      techStack: [...new Set(techStack)],
      ogTags,
    };
  });

  await page.close();

  return {
    url,
    loadTimeMs,
    ...data,
  };
}

// ---------------------------------------------------------------------------
// Generate a PDF from HTML
// ---------------------------------------------------------------------------

/**
 * Renders the provided HTML string into a PDF buffer suitable for storage
 * or email attachment.
 */
export async function generatePdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "40px", bottom: "40px", left: "40px", right: "40px" },
  });

  await page.close();

  return Buffer.from(pdfBuffer);
}
