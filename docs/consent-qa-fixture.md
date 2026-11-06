# Synthetic consent UI fixture — preview only, do not merge

`public/qa-consent.html` is a standalone HTTPS-preview test artifact. It is not a production route or a tracking activation change. Delete the preview branch after QA.

The fixture bundles the actual consent UI script, tracking modules, and contact form handler from the source commit recorded in consent-qa-provenance.json. Form and consent markup come from an actual test build of those components; site CSS is preserved. Only fixture compiler adapters replace the hostname/path checks and supply GTM-TEST123 with reviewedVersion1. Product sources and deployment environment settings are unchanged.

Isolation:
- CSP default-src none, connect-src none, form-action none, frame-src none, object-src none and base-uri none.
- No external script source allowed; inline JavaScript/CSS only, local font resources only.
- Mock Google container insertion removes its src and executes a local inert stub.
- Every fetch is mocked in memory; contact responses can succeed, fail, or remain pending until the test release button.
- SendBeacon and window.open are disabled. Anchor navigation is prevented, and fixture markup links use inert # targets.
- noindex,nofollow plus no-referrer metadata.
- No credentials, real contact values, lead data or real conversion labels. Enter synthetic data only.

Test reject/grant categories, upgrades, repeated saves, close/reopen, withdrawal and explicit reload. Use the controls for mock form success/error/pending states and a fake WhatsApp click. The visible diagnostics show only synthetic counters, consent state and allowlisted dataLayer messages.

This tests actual UI and first-party script behavior. It does not execute Google code or prove Google Consent Mode, GA4/Ads processing, attribution, cookie handling by real tags, or live account settings. Instant successful fake container loading does not exercise slow/failed Google loads; the 503 mailto fallback is not exercised. Host this fixture only on a separate preview origin outside paulaambrosio.com because actual consent cookie-clearing logic remains. It does not replace separate end-to-end validation of the reviewed GTM container. The production no-JavaScript fallback is replaced with an inert test notice for isolation. Header inquiry drawer, real fonts/network loading, and production authentication are outside this minimal fixture.
