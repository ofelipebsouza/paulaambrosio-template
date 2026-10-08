# Product landing pages

The standalone `/layout-starter-kit/` and `/host-up/` routes preserve the supplied
landing-page HTML, visual design, self-hosted fonts, images, and interactions.
They deliberately do not use the institutional header or footer. Discovery links
are added only to `/links/`; existing navigation and contact flows are unchanged.

- Astro wrappers: `src/pages/{layout-starter-kit,host-up}.astro`
- Source head/body markup: `src/data/landings/`
- Isolated assets and browser scripts: `public/landing-assets/<slug>/`
- Consent: the existing `GoogleConsent` component; no new pixel, conversion,
  purchase, or form-submission events have been added.

## Checkout status

Neither landing page accepts payment. Layout + Levantamento remains a prelaunch
interest dialog that opens the visitor's own email application; it does not send
or store a message itself. The R$37 amount is the source's expected launch price.
HOST UP's former Hotmart marketplace links were removed. Its discovery CTAs
scroll to the access section, which says that registration is coming soon.
Add a verified checkout only when the owner supplies and authorizes it, updating
both the access note and the purchase FAQ together.

## Verification

Run `npm run build` (including the repository's post-build route/link/canonical
guard), then `npm run lint`, and `node --test tests/product-landings.test.mjs`.
Check desktop and mobile behavior: language toggle, PDF samples, room/demo
switching, zoom modal, drink keyboard tabs, image viewer, FAQ, and menu dismissal.
Never submit a message or complete checkout as part of these checks.
