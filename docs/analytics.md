# Analytics

## Stack

- Vercel Web Analytics via `@vercel/analytics` 2.x.
- Vercel Speed Insights via `@vercel/speed-insights` 2.x.
- Astro with the Vercel adapter; pages stay static and a single integration lives in `src/layouts/Layout.astro`.

Web Analytics provides privacy-focused pageviews, visitors, routes, referrers, device/browser data and available geographic aggregation. Speed Insights provides Real User Monitoring for Web Vitals, including LCP, INP, CLS, FCP and TTFB when the site receives real traffic.

## Conversion model

**Primary conversion**

- `form_success`: the server accepted the inquiry **and** the SMTP delivery of the notification to the studio did not fail. This is the only event that proves a lead exists, and it is emitted from the browser after `POST /api/contact` answers `200 { ok: true }`.

Nothing is tracked on the server: the API route never calls Analytics, so preview/QA submissions and bot spam are not counted unless the browser reported a success.

**Secondary conversions**

- `cta_start_project`
- `form_submit`
- `phone_click`
- `email_click`
- `whatsapp_click` (reserved for a real WhatsApp link; none currently exists)

**Engagement**

- `cta_explore_services`
- `cta_view_project`
- `cta_turnkey`
- `portfolio_open`
- `service_open`
- `faq_open`
- `instagram_click`
- `form_start`
- `form_error`

## Event taxonomy

| Event | Purpose | Metadata | Trigger |
| --- | --- | --- | --- |
| `cta_start_project` | Measures project intent | `page`, `location` | Start Your Project or consultation CTA |
| `cta_explore_services` | Measures service discovery intent | `page`, `location` | Services CTA |
| `cta_view_project` | Measures project CTA engagement | `page`, `location`, `project` | View project CTA/link |
| `cta_turnkey` | Measures Turnkey-specific intent | `page`, `location`, `service` | Turnkey CTA/link |
| `cta_contact` | Measures direct contact CTA engagement | `page`, `location` | Contact CTA, when present |
| `form_start` | Measures first form interaction | `page`, `form` | First focus on an input/select/textarea |
| `form_submit` | Measures a submission attempt (intent) | `page`, `form` | The form is submitted and the request is sent |
| `form_success` | Measures the confirmed conversion | `page`, `form`, `service`, `property_type`, `delivery` | Server answers `200 { ok: true }` (SMTP) or hands the inquiry to the visitor's mail client because the transport is not configured yet (`delivery: 'mailto'`) |
| `form_error` | Measures a failed submission | `page`, `form` | Non-2xx response or network failure |
| `phone_click` | Measures phone intent | `page`, `location` | Click on `tel:` |
| `email_click` | Measures email intent | `page`, `location` | Click on `mailto:` |
| `whatsapp_click` | Measures WhatsApp intent | `page`, `location` | Click on WhatsApp URL; reserved currently |
| `instagram_click` | Measures Instagram referral intent | `page`, `location` | Click on public Instagram URL |
| `portfolio_open` | Measures opening a public project | `page`, `project` | Project image/link click |
| `service_open` | Measures opening a public service | `page`, `service` | Service listing/card click |
| `faq_open` | Measures FAQ engagement | `page`, `faq` | Opening a FAQ disclosure |

Mapping to the names used in the contact-form brief:

| Brief | Implemented |
| --- | --- |
| `contact_form_started` | `form_start` |
| `contact_form_submitted` | `form_submit` |
| `contact_form_success` | `form_success` |
| `contact_form_error` | `form_error` |

`service` and `property_type` are the only field-derived values allowed in metadata, and both are the visitor's own selection from a fixed list (never free text). Message, name, email, phone and location are never tracked.

Metadata is intentionally small and uses public stable identifiers such as route paths and content slugs. Event names and IDs do not come from visible copy.

## Privacy

- Never send name, email, phone, address, message, project details, tokens, secrets or any field value to Analytics.
- The central wrapper rejects private field names and non-scalar metadata.
- Vercel Web Analytics is designed to use aggregated, anonymized data without third-party cookies. This implementation does not add cookies or a marketing tracker.
- `form_success` is emitted only after the server confirms `200 { ok: true }`, i.e. the notification email was accepted by the SMTP server. A submission that fails validation, is rate limited or fails at SMTP emits `form_error` instead and shows a generic message to the visitor. The single exception is the `503 delivery_unavailable` answer (no SMTP credentials configured on the deployment yet): the inquiry is handed to the visitor's mail client instead of being lost, and the event is emitted with `delivery: 'mailto'` so the fallback path stays measurable.
- Vercel's own privacy and compliance documentation should be reviewed with the site's legal advisor for the applicable jurisdiction.

## Form behavior

Both forms — the Contact page and the Header inquiry drawer — use `data-analytics-form` values `contact` and `project_inquiry`, and both carry `action="/api/contact"`, a same-origin HTTPS endpoint. The delegated layer in `src/components/Analytics.astro` intercepts the submit and sends it with `fetch()`, so the visitor never leaves the page; without JavaScript the browser posts the form normally and each form offers an explicit email/phone alternative in `<noscript>`. A `mailto:` action is deliberately never rendered: Chrome flags it as insecure form submission on HTTPS pages and fails Lighthouse `is-on-https`.

`form_start` is emitted once per form instance, on the first `focusin` inside it (the listener is attached once to the document, at capture). The delegated layer marks each form as processed via `dataset`, so a second bind cannot happen, and it re-runs on `astro:page-load` for pages added later. The submit listener is only attached to forms that have an `action`, and it is the only place that talks to the API — no component posts on its own.

Sequence: first focus → `form_start` · submit → native constraint validation → `form_submit` → `POST /api/contact` (server validates, rate limits, checks the honeypot and Turnstile, resolves the recipient, sends over SMTP) → `200 { ok: true }` → `form_success`, form reset and the accessible status message. Any failure — non-2xx response (validation, rate limit, missing transport, SMTP error) or a network failure — throws in the same place and emits `form_error`; the status message is generic and the typed values are kept. The reason is decided server-side, returned in the JSON body and written to the server log; the browser never reports an internal error and Analytics never receives one.

Server response shape: `200 { ok: true }` on success (also the answer to a honeypot hit, which sends nothing); `422 { ok: false, error: 'validation_failed', errors }` for validation; `429` with a `Retry-After` header when rate limited; `503` when no mail transport is configured; `502` when the SMTP server rejects the message. Internal errors are logged server-side with a request id and never returned to the browser.

Form architecture, SMTP setup and the DNS prerequisite are documented in [`contact-form.md`](./contact-form.md).

## Campaign tracking / UTM

No custom cookies, local storage or cross-site campaign identifiers are implemented. Vercel Web Analytics automatically records the pageview context and applies its own query-parameter filtering.

Future campaign parameters may include `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` and `utm_term`. Do not add them to custom event payloads by default. If campaign attribution must be attached to a lead, record only the needed attribution fields in the form backend, separately from Web Analytics and never alongside PII in an Analytics event.

## Environments

- **Development:** the Analytics component uses development mode, which is intended for local debugging and does not represent production traffic. Speed Insights follows the package's development behavior.
- **Preview:** the instrumentation is present for QA. Preview traffic should be interpreted separately from production in the Vercel project/dashboard.
- **Production:** the Analytics component uses production mode and Vercel receives pageviews/events after the project is deployed and enabled.

## Vercel activation

Adding the packages and code does not prove that the dashboard features are enabled. Confirm manually in the Vercel project:

1. Vercel → Project → **Analytics** → **Enable**.
2. Vercel → Project → **Speed Insights** → **Enable**.
3. Deploy the project and verify requests under the Vercel-managed Analytics and Speed Insights paths in the browser Network panel.
4. Custom Events are subject to the limits and plan availability shown by the current Vercel dashboard; Vercel currently documents custom events for Pro and Enterprise plans.

## Future analytics API

A future `/admin/analytics` or external dashboard can query aggregated data server-side. Any Vercel API token must remain in a server environment variable and must never be exposed as `PUBLIC_VERCEL_TOKEN` or sent to browser code.

Potential future metrics:

- Visitors and pageviews
- Project inquiries
- Form completion rate
- CTA rate by location
- Top service and project
- Top location and campaign source
- LCP/CLS/INP by route and device
