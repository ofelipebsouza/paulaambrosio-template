# Change Order checkout preparation

Default: launch-interest flow; no checkout destination and no direct Meta loader on
this landing. No sales/payment event is emitted by the interest modal or mailto.

## Release configuration

Set these in the **build environment**, then rebuild (Astro statically renders
`/change-order/`; changing a server runtime variable alone does nothing):

- `CHANGE_ORDER_CHECKOUT_URL`: owner-verified direct `https://pay.hotmart.com/<offer>`
  URL for the US$27 system, PT + EN editions.
- `CHANGE_ORDER_BUNDLE_CHECKOUT_URL`: separately verified direct Hotmart link for
  the US$36.99 system + Room Checklist + Rental bundle. Missing/invalid bundle
  keeps that selection in the interest flow, even if base checkout is available.
- `PUBLIC_CHANGE_ORDER_META_DIRECT_ENABLED=true`: explicit opt-in to the direct
  pixel bootstrap and click handler on this landing. Keep false until ownership
  and the current live GTM/other tag configuration have been reviewed. The existing
  `META_PIXEL_ENABLED` switch must also remain enabled; ID is fixed at
  `577841214418796`. Do not also configure the same events in GTM/Hotmart.

The URL validator accepts only HTTPS pay.hotmart.com with a nonempty alphanumeric
path, optional query, no credentials/port/fragment. Marketplace/shortener links
are rejected. These settings are public output, never secrets. Validate any query
parameters, offer, USD price, bundle contents, language and delivery with Hotmart
before release. If Hotmart supplies another URL format, review the validator;
do not substitute a guessed destination. Checkout works regardless of consent.

Direct measurement requires the production host, current advertising consent,
and the same owned fbq/_fbq references. Existing foreign queues block init. An
SDK failure or revocation is terminal until reload, including back/pageshow.
InitiateCheckout uses trackSingle for the confirmed ID, with no explicit payload.
It records an outbound activation, not payment or proof the destination loaded.
No tracking failure delays/cancels navigation. A successful measurement suppresses
repeated activations for that departure until pageshow restores a fresh attempt.
Failed measurement remains retryable. Synthetic clicks, selection changes and
modal/email actions do not emit checkout events.

## Remote review evidence and limits

Parent task verified the published GTM resource at approximately 2026-11-03
21:12 UTC: version 11, SHA256
`ddd924c61f3a1f7762292c038b1021bd96c4857fa09a42781745ad5c40956831`.
Static scan found no facebook/fbevents/fbq/577841214418796/InitiateCheckout/__html.
This is a snapshot, not a pinned version or dynamic browser audit. Runtime guards
cannot stop an unrelated third party from installing tags later. Recheck before
enabling and after GTM changes. Parent also verified live HTML was launch-only,
and the only open PR was unrelated draft #3 (DO NOT MERGE); it was not reused.

Actual Hotmart checkout validation is blocked until the real links exist. The owner
has authorized publishing this preparation with checkout absent and direct Meta
tracking disabled. Advertising settings and spend are outside this site release.

## Local verification (2026-11-03)

Base commit: `1256428384d6d35d6e934400d51772299ed5b29f`.
No AGENTS.md or .agents/skills instructions were present in the workspace/repo.
No credentials or runtime variables were configured in the managed environment;
production Vercel environment variable names were inspected without decryption;
no environment settings were modified.

Passed:
- `node --test tests/meta-pixel.test.mjs tests/change-order*.test.mjs tests/google-consent.test.mjs tests/privacy-disclosure.test.mjs tests/product-landings.test.mjs`: 43/43.
- `npm run tracking:test`: 20/20.
- `npm run lint`: exit 0 after Astro generated content types.
- `ASTRO_TELEMETRY_DISABLED=1 npm run build`: exit 0, including 12/12 accepted-lead tests and the 104-page link/canonical guard (98 sitemap URLs).
- Local configured build with TESTBASE/TESTBUNDLE fixture paths and direct tracking enabled: exit 0; parsed generated HTML contained the two exact fixture destinations and client checkout handler. No requests to fixture destinations were made. Final build restored empty settings.
- Parsed final default build: empty destination attributes, hidden anchor with no href. Executing the actual compiled switch-off bootstrap performed no DOM work.
- `node --check public/landing-assets/change-order/script.js` and `git diff --check`: exit 0.

Initial environment/harness failures resolved: npm's default home cache was not
writable (used `/tmp/paula-npm-cache`); Astro telemetry's home config write failed
(disabled telemetry for local builds); pre-build lint lacked generated content
types; a jsdom strict-eval export fixture needed explicit window assignment.
Two ad hoc build assertions assumed quoted empty attributes and dead-code removal;
replaced with DOM parsing and execution of the compiled disabled bootstrap.
No current check failures. Build reports existing informational JSON-LD omissions
on the three advertising landings.

Not run: real-browser desktop/mobile visual audit, live Meta Test Events/network
delivery, checkout/payment/delivery validation, or production deployment checks.
No link is available for actual checkout validation. These local results precede
publication; PR and production verification are recorded in the release report.
No advertising settings or spend change is included.

Release preflight: current main and the production deployment both match the base
commit above. The verified production domains belong to Vercel project
`prj_2VUxoboe3mE1hKMT04fKSK950aa1`. Neither checkout URL variable nor
`PUBLIC_CHANGE_ORDER_META_DIRECT_ENABLED` exists in the project environment
list (hidden production environment count: zero). Thus this release keeps the
launch-interest fallback and direct tracking disabled without changing settings.
