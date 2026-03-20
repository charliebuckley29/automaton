# Harper Automation — Decision Log

Per Section 12.4 of the architecture document, all deviations from spec are logged here.

## 2026-03-20: Clean slate rebuild

- **What changed:** Removed prior automaton codebase (sovereign AI agent runtime). Repo repurposed for Harper Automation.
- **Why:** Completely different tech stack and purpose. Prior code was SQLite/blockchain CLI agent; Harper requires Next.js + GCP + Supabase web application.
- **Downstream:** Git history preserved. All new code from scratch.

## 2026-03-20: Phase 2 — Memory + Sequences

- **What built:** Business intelligence engine, CRM sync (Airtable), email sequences (Loops), free scorecard funnel, offer system (Stripe coupons), bulk credit packs, agency white-label flow, enhanced dashboard with 4 tabs, admin dashboard, SMB landing page, agencies landing page, DataForSEO integration.
- **Deviations from spec:**
  - `interview-state.ts` retains the Phase 1 basic format detection (`standard`/`returning`/`deep_dive`) alongside the new spec-compliant version in `lib/intelligence.ts` (`first_time`/`progress`/`deeper_dive`/`focused`). The research route now uses the spec version. Voice route still references the older one via `interview_state` table — no conflict, the new format is stored in `voice_interview_state`.
  - Email templates use placeholder variables (`{{businessName}}`, etc.) rather than a compiled templating engine. Handlebars integration deferred to Phase 3 per TODO.
  - Claude model IDs use `20250514` date suffix as the latest available. Will update when newer model versions release.
- **Downstream:** Phase 2 is independently deployable. All new routes mounted in index.ts. New env vars documented in .env.example.
