# Internal CRM

The studio pipeline behind `/admin/`: every inquiry that reaches the contact
page or the header modal, its follow-up deadlines, the conversion funnel and the
live report posted by the **Hermes Agent**, with **JEV** consuming the events.

It is internal by construction — not linked from the site, `noindex` on every
route, `Disallow: /admin/` and `Disallow: /api/crm/` in `robots.txt`, and a
session cookie that never leaves the server.

---

## 1. Architecture

```
contact page / header modal
        │  POST /api/contact/
        ▼
 api/contact.ts ──┬─► Upstash Redis   crm:lead:*   ← the pipeline
                  ├─► SMTP            studio inbox + visitor confirmation
                  └─► JEV webhook     lead.created (signed)

 GET  /api/crm/metrics/    KPIs                      ┐
 GET  /api/crm/leads/      paged pipeline            │
 PATCH /api/crm/leads/:id/ status, note, assignee    │ session cookie
 GET  /api/crm/tasks/      follow-up queue           │
 GET  /api/crm/report/     latest Hermes report      ┘
 GET  /api/crm/export/     CSV                       ┘

 GET  /api/crm/report/  + x-hermes-token   ← Hermes pulls its KPI payload
 POST /api/crm/report/  + HMAC signature   ← Hermes posts the report back
 GET  /api/crm/cron/followups/             ← Vercel Cron (09:00) or JEV
```

Everything is server-rendered on demand (`export const prerender = false`), so
no CRM HTML is ever written to `dist/` or reachable without the guard.

## 2. Storage

Upstash Redis over REST — the same backend as the distributed rate limiter, no
SDK, no new dependency. Keys are prefixed `crm:` and cannot collide with
`rl:contact:*`.

| Key | Type | Purpose |
| --- | --- | --- |
| `crm:lead:{id}` | string (JSON) | the lead document |
| `crm:idx:time` | zset | timeline, score = received epoch |
| `crm:idx:email:{hmac}` | string | lookup by address without storing it raw |
| `crm:events:{id}` | zset | status changes, notes, delivery results |
| `crm:metrics:{YYYY-MM-DD}` | hash | daily counters |
| `crm:task:{id}` · `crm:idx:tasks` | string · zset | follow-up deadlines |
| `crm:report:last` | string (JSON) | latest Hermes report |

**Without credentials** every operation falls back to an in-process store and
the dashboard header shows `Storage · in memory` — data survives the request,
not the deployment. The inquiry itself is never affected: the CRM write is
wrapped in `try/catch` and a failure logs `crm_store_failed`, never an error
response.

Retention: leads are ordinary business records. If a purge policy is required,
add `CRM_RETENTION_DAYS` and delete from `crm:idx:time` in the cron route.

## 3. Access

1. `CRM_PASSWORD` (required) — compared with `timingSafeEqual`.
2. On success the server sets `crm_session` = `exp.hmac`, `HttpOnly`,
   `SameSite=Lax`, `Secure` on HTTPS, 12 h (`CRM_SESSION_TTL`).
3. `CRM_SESSION_SECRET` signs it; if unset the key is derived from the password
   and a warning is logged once.
4. Login is rate limited per IP through the same Upstash limiter (5 / 10 min).
5. `requireCrm()` guards every `/api/crm/*` route and both `/admin/` pages:
   browsers are redirected to `/admin/login/`, API calls get `401`.

## 4. Pipeline and metrics

Statuses: `novo → em_contato → proposta → fechado | perdido`
(labels shown in English, matching the site copy).

Moving a lead out of `novo` (or clicking *Mark as answered*) stamps
`firstResponseAt`, closes that lead's open follow-up tasks, records a timeline
event and fires `lead.status_changed` / `lead.responded` to JEV.

KPIs served by `GET /api/crm/metrics/`:

- leads in the last 30 days, new today, total;
- awaiting reply vs. open pipeline;
- average first response (hours) and % answered within 24 h;
- conversion = won ÷ closed;
- funnel by status; breakdowns by service, location, source form and budget;
- 30-day daily volume; open and late follow-up tasks.

## 5. Hermes contract

Two authenticated directions, both documented for the agent itself:

**Pull** — `GET https://www.paulaambrosio.com/api/crm/report/` with
`x-hermes-token: $HERMES_TOKEN` returns `{ ok, report, metrics, leads, storage,
generatedAt }`. `HERMES_TOKEN` must be configured or the route answers `503
hermes_not_configured` rather than exposing inquiries.

**Push** — `POST` the same route with the report:

```json
{
  "generatedAt": 1790000000000,
  "summary": "Leads slowed this week but response time improved.",
  "highlights": ["12 new inquiries", "Median first reply: 4 h"],
  "actions": ["Follow up with the 3 Bal Harbour inquiries"],
  "kpis": { "last30": 12 }
}
```

When `HERMES_WEBHOOK_SECRET` is set the body must carry
`x-hermes-signature: sha256=HMAC-SHA256(rawBody, secret)`; without it the static
token is accepted. `summary` is mandatory (max 2000 chars), `highlights` and
`actions` cap at 12 items of 400 chars each.

The dashboard polls it every 30 s and falls back to "Waiting for Hermes" — a
missing or malformed report never breaks the page.

## 6. JEV contract

Outbound events, POSTed to `JEV_WEBHOOK_URL` with a 5 s timeout, signed as
`x-jev-signature: sha256=HMAC-SHA256(rawBody, JEV_WEBHOOK_SECRET)`:

| Event | When | Payload |
| --- | --- | --- |
| `lead.created` | inquiry accepted | full lead reference |
| `lead.status_changed` | pipeline move | lead + `previousStatus` |
| `lead.responded` | first reply recorded | lead |
| `task.overdue` | cron found late tasks | count + up to 20 tasks |

Delivery is best effort: an absent or failing automation logs
`jev_webhook_failed` and changes nothing else. Leaving `JEV_WEBHOOK_URL` empty
disables it entirely.

## 7. Follow-up automation

Every new lead creates two tasks — first contact at `CRM_FOLLOWUP_HOURS`
(default 24 h) and second attempt at `CRM_FOLLOWUP_SECOND_HOURS` (default 72 h).

`GET|POST /api/crm/cron/followups/` (Vercel Cron, daily at 09:00 UTC, or the
*Send reminders* button on the dashboard):

1. collects open tasks past their deadline, ignoring anything reminded in the
   last 12 h;
2. sends **one** digest email to `CONTACT_RECIPIENT_EMAIL` using the same logo
   shell as the inquiry templates;
3. stamps `remindedAt`, emits `task.overdue` and returns the counts.

The route requires `Authorization: Bearer $CRON_SECRET` (Vercel sends it
automatically when `CRON_SECRET` is set) or a valid dashboard session.

## 8. Configuration checklist

| Variable | Needed for |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | durable storage |
| `CRM_PASSWORD` | login (route is `503` without it) |
| `CRM_SESSION_SECRET` | independent session key |
| `HERMES_TOKEN` | Hermes pulling KPIs |
| `HERMES_WEBHOOK_SECRET` | signed Hermes reports |
| `JEV_WEBHOOK_URL` / `_SECRET` | outbound automation |
| `CRON_SECRET` | the reminder cron |
| `CRM_FOLLOWUP_HOURS` / `_SECOND_HOURS` | deadlines (24 / 72) |

`.env.example` lists them with comments; `src/env.d.ts` keeps TypeScript honest.

## 9. Verification

```bash
npm run lint            # tsc
npm run build           # astro build + scripts/check-links.mjs
npm run lead:test       # real inquiry → appears in /admin/
```

Manual pass: sign in → wrong password rejected; `/api/crm/metrics/` without a
cookie answers 401; changing a status in the table updates the funnel and the
first-reply column; *Send reminders* returns counts; `POST /api/crm/report/`
with a bad signature answers 401.
