# Harper Automation — Decision Log

Per Section 12.4 of the architecture document, all deviations from spec are logged here.

## 2026-03-20: Clean slate rebuild

- **What changed:** Removed prior automaton codebase (sovereign AI agent runtime). Repo repurposed for Harper Automation.
- **Why:** Completely different tech stack and purpose. Prior code was SQLite/blockchain CLI agent; Harper requires Next.js + GCP + Supabase web application.
- **Downstream:** Git history preserved. All new code from scratch.
