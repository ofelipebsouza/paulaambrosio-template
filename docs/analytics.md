# Analytics

## Stack

- Vercel Web Analytics via `@vercel/analytics` 2.x.
- Vercel Speed Insights via `@vercel/speed-insights` 2.x.
- Astro static output with one integration in `src/layouts/Layout.astro`.

Web Analytics provides privacy-focused pageviews, visitors, routes, referrers, device/browser data and available geographic aggregation. Speed Insights provides Real User Monitoring for Web Vitals, including LCP, INP, CLS, FCP and TTFB when the site receives real traffic.

## Conversion model

**Primary conversion**

- `form_submit`: a configured `CONTACT_FORM_ENDPOINT` responds successfully with a 2xx status.

**Secondary conversions**

- `cta_start_project`
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
| `form_submit` | Measures confirmed form conversion | `page`, `form` | Configured endpoint returns 2xx |
| `form_error` | Measures failed endpoint submission | `page`, `form` | Network error or non-2xx response |
| `phone_click` | Measures phone intent | `page`, `location` | Click on `tel:` |
| `email_click` | Measures email intent | `page`, `location` | Click on `mailto:` |
| `whatsapp_click` | Measures WhatsApp intent | `page`, `location` | Click on WhatsApp URL; reserved currently |
| `instagram_click` | Measures Instagram referral intent | `page`, `location` | Click on public Instagram URL |
| `portfolio_open` | Measures opening a public project | `page`, `project` | Project image/link click |
| `service_open` | Measures opening a public service | `page`, `service` | Service listing/card click |
| `faq_open` | Measures FAQ engagement | `page`, `faq` | Opening a FAQ disclosure |

Metadata is intentionally small and uses public stable identifiers such as route paths and content slugs. Event names and IDs do not come from visible copy.

## Privacy

- Never send name, email, phone, address, message, project details, tokens, secrets or any field value to Analytics.
- The central wrapper rejects private field names and non-scalar metadata.
- Vercel Web Analytics is designed to use aggregated, anonymized data without third-party cookies. This implementation does not add cookies or a marketing tracker.
- The `mailto:` fallback remains available when no endpoint is configured. Opening an email client is **not** counted as `form_submit`, because it does not prove delivery.
- `form_submit` is emitted only after the configured endpoint confirms success with a 2xx response. `form_error` is emitted for network failures or non-2xx responses.
- Vercel's own privacy and compliance documentation should be reviewed with the site's legal advisor for the applicable jurisdiction.

## Form behavior

The Contact page and the Header inquiry modal use `data-analytics-form` values `contact` and `project_inquiry`.

`form_start` is emitted once per form instance on the first focus interaction. The central event delegation layer prevents duplicate submit listeners and safely reinitializes if Astro navigation is introduced later.

When `CONTACT_FORM_ENDPOINT` is present, submission is progressively intercepted with `fetch()` and `FormData`. Only the HTTP result is sent to Analytics; form contents are never included. When it is absent, the native `mailto:` behavior is preserved.

For production conversion measurement, configure `CONTACT_FORM_ENDPOINT` as an endpoint that accepts the form and returns an appropriate 2xx response after the lead has been accepted. Cross-origin endpoints must permit the browser request with the appropriate CORS policy.

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
