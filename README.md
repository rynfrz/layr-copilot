# Layr Copilot — Admin App (Phase 1)

The rules-and-workflow engine behind Layr Copilot. Admins/Team Leads manage the
five entity lists and build **playbooks** (Ticket Containers); the **Simulator**
proves how a ticket resolves to a playbook and checklist — all without HubSpot yet.

## What's in Phase 1
- **Auth & roles** — first-run admin setup, login; roles: Admin, Team Lead (can edit), Account Manager (read).
- **Entities** — five editable lists: Broker Partners, Carriers/Wholesalers, Lines of Business, Support Categories, Billing Types (add / rename / deactivate / remove).
- **Playbooks** — match criteria across the five entities + an ordered set of steps. Step types: checklist, task, email, status change, data check. Each step has a responsible role (Ticket Owner vs Contributor), an optional **"only show when"** condition (e.g. Billing Type = Agency Bill), and reference links. One playbook is the **Default fallback**.
- **Rules engine** (`lib/match.js`, pure & tested) — most-specific match wins; ties by priority; falls back to the Default when nothing matches or when multiple policies conflict.
- **Simulator** — pick a ticket's attributes → see the resolved playbook, the reason, and the live checklist with conditional steps applied.
- **Seeded data** — the five entity lists + the real **Cancellation** playbook (encoded from Layr's Cancellation Process SOP) + a **Default** workflow.

## Run / deploy (same stack as before)
1. Create a Postgres DB (Neon, e.g. via Vercel Storage).
2. Set env vars: `DATABASE_URL` (or `POSTGRES_URL`) and `SESSION_SECRET`
   (`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`).
3. `npm install` then `npm run dev` (local) — visit `/setup` to create the admin.
   On Vercel: import the repo, attach Postgres, add `SESSION_SECRET`, deploy.

The schema and seed data create themselves on first request (idempotent).

## How this maps to the architecture (see ../ARCHITECTURE.md)
This is **Component A** (admin app + rules engine). `POST /api/match` is the exact
logic Layr Copilot's HubSpot serverless function will call in Phase 2 — feed it a
ticket's entity values, get back the playbook + applicable steps.

## Next: Phase 2
- HubSpot developer project + private app (Service Hub Enterprise) + scopes.
- UI Extension on the Ticket that reads the record → maps to the entity combination
  → calls `/api/match` → renders the checklist (read-only first, then write-back).
- Entity-mapping config (which HubSpot property/association feeds each entity).
