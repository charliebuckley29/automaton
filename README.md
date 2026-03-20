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
