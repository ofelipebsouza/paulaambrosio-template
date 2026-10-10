# Consent-gated Google loader

The release loads GTM-T36P2G6X only after an optional consent grant on www.paulaambrosio.com. The original reviewed baseline version 9 was bridge-only; version 10 enabled consent-gated GA4. The receipt-based Google Ads repair described below requires its separately reviewed GTM publication. The code reference does not pin the live GTM version.

## Release and rollback controls

- The reviewed public container ID and baseline version are in src/lib/google-tracking/config.ts. They are not credentials.
- PUBLIC_GOOGLE_TRACKING_ENABLED=false disables the loader and consent markup on the next build/deployment. Missing means this reviewed release is enabled; values other than the exact string true also disable it.
- The former PUBLIC_GTM_CONTAINER_ID and PUBLIC_GTM_REVIEWED_VERSION placeholders are no longer used; container changes require a code review.
- The reviewed-version value is an audit reference, **not version pinning**. Normal GTM serves the currently published version. Review every remote publication before it becomes live.
- Roll back by disabling the loader and rebuilding, or by restoring reviewed bridge-only GTM version 9. Do not restore older versions that enable measurement tags. These rollback controls affect subsequent loads; already-open pages need reload/navigation to unload existing code.
- Preview/local/apex/private routes remain runtime-disabled; the apex redirects to www. The consent markup is hidden until the canonical-host runtime gate passes. There is no noscript iframe or separate gtag loader.
- Official Tag Assistant may test an unpublished GA4-only workspace on the staged canonical site. Keep Ads base, linker, WhatsApp, Thanks and remarketing paused; no live inquiries or Ads conversions during QA.
- Before enabling any measurement tags, verify actual consent ordering, payloads, withdrawal, lack of duplicate tags and lack of form-field collection. Update the public privacy notice when the paused setup becomes active. Enhanced conversions, automatic user-provided-data collection, Google Signals and personalized ads remain off.
- GA4 measurement ID G-SQ8YH86GL9, stream 16056096020; enhanced measurement off. Configure inside GTM only. Accepted-inquiry reporting now uses the receipt-only event below; generic form success remains excluded.

## Consent contract

Basic, opt-in loading: no GTM request before an explicit analytics and/or advertising measurement grant. Distinct unchecked choices, equally available rejection, persistent Privacy choices control. Store only a versioned preference and timestamp; consent is valid for 90 days. Expired/invalid preferences are treated as denied, not automatically erased from storage. Advertising personalization always remains denied. This describes implemented controls, not a legal-compliance determination.

The first dataLayer message is `paula_consent_update`, carrying only:
- paula_analytics_consent: granted/denied
- paula_advertising_consent: granted/denied
- paula_ad_personalization: denied

Then the standard gtm.js initialization is queued and exactly one container is injected, followed by paula_consent_ready (carrying only page_section/service_key). Every subsequent permission increase similarly queues paula_consent_update before paula_consent_ready. Do not initialize measurement tags on the same consent-update event: Google applies the consent API update after that event and before the next queued event. Trigger category-gated base/config/linker tags on paula_consent_ready, then process later measurement events. Configure a reviewed GTM consent template using setDefaultConsentState / updateConsentState (see companion template source) on Consent Initialization and paula_consent_update, ahead of measurement. Do not replace these with delayed Custom HTML gtag consent commands.

GTM configuration must enforce additional consent checks and explicit granted-state triggers, rather than relying solely on built-in denied-mode behavior (which can send cookieless pings):
- GA4: require analytics_storage + paula_analytics_consent=granted. Disable automatic pageview, enhanced measurement form interaction and user-provided data features. Send only the explicit paula_page_view and allowlisted engagement events.
- Google Ads config/linker/WhatsApp: require ad_storage and ad_user_data + paula_advertising_consent=granted. No All Pages remarketing tag. ad_personalization stays denied.
- No default-consent-independent tags, link URL/contact field variables or arbitrary dataLayer exports.

Permission removal stops first-party event emission immediately, updates the consent template, clears targeted first-party Google cookies and offers an explicit reload to unload Google runtime code. It never automatically navigates away from an unfinished inquiry. Tags already loaded can react to a consent update; remote-container QA must verify withdrawal behavior too. Failed preference persistence is explicitly reported and measurement pauses on the page. Browser storage restrictions may prevent erasing old preferences; do not claim successful revocation persistence in that case. Cross-tab and restored-page preference changes are honored. Withdrawal during a pending container download removes its script and replaces queued grants/events with a denied-only state; this still requires actual browser/container race verification before release.

## Events and service alignment

Existing Vercel/internal analytics remain separate. Google receives no existing metadata object. New Google events receive only event name, page_section and service_key derived from fixed public route mappings. No raw URLs, query strings, hash, form values, link URLs, names, email, phone, budget, messages, client IDs, CRM lead IDs or enhanced-conversion data are pushed by this module. The dedicated accepted-inquiry event additionally carries only its opaque transaction_id.

Public service taxonomy: design_consultation, design_express, turnkey_interiors, luxury_residential, hospitality_interiors. Unknown or visitor-controlled route strings become a coarse section and service_key=none.

Allowlisted events are prefixed paula_: page_view, CTA interactions, form_start/form_submit/form_error, phone_click/email_click/whatsapp_click, instagram_click, portfolio_open/service_open/faq_open. Pageview is once per document, not replayed after repeated consent saves. Events before consent are dropped, never replayed.

WhatsApp is intended as a **secondary click**, not proof of a conversation or lead. Keep Ads forwarding paused until its conversion action is verified as Secondary. It requires advertising consent and maps inside GTM to its verified WhatsApp action. A clicked WhatsApp event is not reused as form conversion. No WhatsApp link is added in this change.

## Receipt-only accepted-inquiry conversion

The obsolete URL conversion expected `/thanks`, which is absent from the current inline form flow. The manual action **PA | Lead Accepted | Receipt** uses `AW-11180985503/KVMACN2h-JcdEJ-ZwdMp`, count one, value 0, no enhanced conversions. The old `/thanks` action is secondary and its GTM tag stays paused.

Only the HTTPS contact response's valid version-1 acceptance receipt can enter `measureGoogleAcceptedLead`. The server issues this random UUID only after durable acceptance. HTTP 200 alone, suppressed spam/honeypot responses, form attempts, generic form success, page views and memory-only persistence never prove acceptance. SMTP errors after durable acceptance may still carry a valid receipt; acceptance is not proof of email delivery, qualification or sale.

With current advertising consent, the dedicated boundary emits `paula_lead_accepted` with `transaction_id`, `page_section` and `service_key`. It strips any extra receipt fields, rejects malformed receipts, and deduplicates both in the document and across reloads using at most 100 opaque session IDs. Google's transaction ID provides destination-side deduplication as well. No pre-consent receipt is stored for later replay. Withdrawal, expired/unreadable consent, failed preference persistence and a pending-container revocation stop emission. Initial denial clears old session receipt history.

GTM configuration: initialize the Google tag `AW-11180985503` and conversion linker on `paula_consent_ready`, requiring granted advertising consent plus `ad_storage` and `ad_user_data`. Fire only the new Google Ads conversion tag on `paula_lead_accepted`; map its transaction ID to the `transaction_id` data-layer variable, and require the same consent checks. Keep personalization denied, automatic user-provided data collection and enhanced conversions off, and obsolete Thanks, WhatsApp and remarketing tags paused. Do not map the receipt event to a generic GA4 tag or map `paula_form_submit` to a conversion. There is no additional standalone gtag loader.

OpenAI measurement remains independent and receives the same acceptance receipt through its existing separate boundary. No API, durable-store, SMTP or form UX change is needed for this repair.

`tests/google-accepted-lead.test.mjs` is offline: it compiles the real browser boundary into a fake DOM/storage VM and never loads Google, creates a real inquiry or sends email. `scripts/build.mjs` runs this safety suite before Astro so both preview and production builds enforce it.

## Verification before release

Offline tests: disabled/placeholder/preview/private routes, absent/denied/granted/withdrawn consent, expired/corrupt preferences, one container load, pageview dedupe, no preconsent replay, separate analytics/ad gating, event and metadata allowlists, accepted-form suppression, failure isolation.

Then full CRM regressions, typecheck, build/link checks. On an isolated reviewed GTM version, use Tag Assistant/network inspection to test consent ordering, no preconsent or denied-category requests, withdrawal and absence of duplicate tags/contact data. Inspect actual GA4 and Ads payloads, not just dataLayer. Do not use live lead forms or real Ads conversion events for QA without explicit approval. Search Console needs ownership/verification inspection and sitemap submission separately, never an invented tracking script.

Official references:
- https://developers.google.com/tag-platform/security/guides/consent
- https://developers.google.com/tag-platform/security/concepts/consent-mode
- https://developers.google.com/data-manager/api/devguides/events/google-ads/online/send-events
- https://developers.google.com/data-manager/api/devguides/quickstart/set-up-access

## Search Console verification

The verification scope is the exact URL prefix https://www.paulaambrosio.com/. The public google-site-verification meta tag is included in the shared public-page head. This makes no DNS change and loads no script. The meta must remain on the live homepage to maintain this verification method.

