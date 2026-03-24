# Harper Automation

Boutique AI-powered growth agency for UK and US SMEs. Voice-first intelligence interviews powered by Claude, delivered as actionable business reports.

## Architecture

```
harper-web/    → Next.js 14 (App Router) — deployed to Vercel
harper-api/    → Node.js 20 / Express — deployed to Google Cloud Run
supabase/      → Database migrations and seed data
```

## Quick Start

```bash
# Frontend
cd harper-web && pnpm install && pnpm dev

# API
cd harper-api && pnpm install && pnpm dev

# Database migrations
cd supabase && supabase db push
```

## Stack

- **Frontend:** Next.js 14, Tailwind CSS, shadcn/ui, Framer Motion
- **API:** Node.js 20, Express, Docker, Google Cloud Run
- **Database:** Supabase (Postgres, Auth, Storage, Realtime)
- **Payments:** Stripe (Checkout, Subscriptions, Webhooks)
- **Voice:** ElevenLabs (STT/TTS) + Anthropic Claude (conversation intelligence)
- **Email:** Resend (transactional) + Loops (sequences)
- **CRM:** Airtable
- **Research:** DataForSEO, Google PageSpeed API, Puppeteer

## Services

- **Business Diagnostics** — AI-powered deep research of a brand's website, online presence, SEO, socials, competitors. Delivered as an actionable report with prioritised recommendations.
- **SEO & Local Search** — Technical SEO, Google Business Profile, local citations, content strategy execution.
- **Automation & Operations** — CRM setup, workflow automation, invoicing sequences, data pipelines.
- **Growth Strategy** — Quarterly re-diagnostics, competitor monitoring, revenue opportunity identification, strategic roadmaps.
- **AI Lead Generation** — Custom-built AI scraping and data enrichment pipelines triggered by real-world intent signals. Unlimited in-house lead gen for clients. Examples:
  - Accountants: alerts + deep research when new companies register on Companies House
  - Property developers: notifications when planning permits are approved in target areas or for specific land types
  - Recruiters: tracking new job postings or funding rounds in target sectors
  - Any industry: custom triggers based on public data sources, enriched with AI research and delivered as actionable leads

## The Harper Agent — "What Can Harper Do For You?"

The interview agent is evolving from a paid voice conversation into a **hyper-personalised consultant** that audits your business for free and shows you exactly where Harper can help. The flow:

1. **Deep research** — scrape and analyse the business's website, social media, online presence, reviews, SEO, competitors
2. **Find the gaps** — outdated websites, neglected socials, missing SEO basics, manual processes, no lead pipeline — every area where a Harper service applies
3. **Priority roadmap** — rank opportunities by impact and effort, map them to specific Harper services
4. **Next steps** — clear action plan: "Here's what we'd fix first, here's what it costs, here's the expected outcome"

The agent uses all the same deep research, scraping, and analysis techniques as the diagnostic reports — but the output is a free, personalised sales tool that converts by showing value upfront. Easy wins (terrible website, zero SEO, dead socials) become obvious starter packages.

## TODO

### Product
- [ ] Build the "What Can Harper Do For You" agent — free audit flow that maps gaps to services
- [ ] Add AI Lead Generation as a service offering (services page, pricing, onboarding flow)
- [ ] Design lead gen trigger builder UI — let clients configure their own intent signals and alerts
- [ ] Build Companies House / planning permit / public data source integrations for lead gen triggers
- [ ] Data enrichment pipeline — take a trigger event, enrich with AI research, deliver as an actionable lead

### Technical Debt
- [ ] Send welcome email on bulk credit assignment (`harper-api/src/routes/bulk/index.ts:206`)
- [ ] Replace fire-and-forget report generation with a proper job queue like BullMQ (`harper-api/src/routes/agent/voice.ts:149`)
- [ ] Integrate real social media APIs (Meta Graph, LinkedIn) instead of scrape fallback (`harper-api/src/lib/research.ts:99`)
- [ ] Move report HTML generation to Handlebars templates (`harper-api/src/routes/reports/generate.ts:422`)
- [ ] Extract inline page components into `components/dashboard/`, `components/marketing/`, `components/report/`
- [ ] Reconcile interview state formats between Phase 1 and Phase 2 tables
