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

## Change Order System

The `/change-order/` page is isolated like the previous two landings and appears
only under Cursos & Materiais on `/links/`. Its Portuguese product copy follows
the supplied policy/request/log/cost-reference/practice material. Main product: full Portuguese and English editions, each in DOCX and PDF.
Optional Room Checklist + Rental: two guides, each in Portuguese and English
DOCX and PDF editions.
Price: US$27; optional add-on US$9.99; selected total US$36.99. Selection is a local
price illustration only, not a cart, reservation, purchase, or payment.

Checkout is pending. The interest dialog only opens a composed email in the
visitor's mail app; nothing is sent or stored by this page. Use a verified,
owner-authorized checkout when supplied, and update both the offer and FAQ.
No paid PDF/DOCX is public. Artwork shows conceptual covers and is labeled as
illustrative; do not describe it as actual interior pages or exact cover previews.
No testimonials, guarantees, countdowns, discounts, or legal-protection promises.
Professional policy fields require adaptation and local legal review.

Additional verification: `node --test tests/change-order.test.mjs`. Test mobile
menu opening/closing, Escape, anchor navigation, repeated optional add-on toggles,
price and email-draft selection consistency, dialog close/backdrop/Escape/focus,
FAQ, no horizontal overflow, and reduced-motion behavior. Do not send the email.

### Page languages

Change Order supports PT and EN through a single accessible language selector.
English is shareable at `/change-order/?lang=en`; Portuguese is the default.
The page changes text, image artwork, alt text, ARIA labels, currency punctuation,
email draft, title/description and `html.lang` without re-creating controls or
losing the optional add-on selection. It stores no language cookie or browser
storage. The query is replaced, preserving the URL's other parameters and anchor.
The canonical remains `/change-order/`; the selector needs JavaScript. No duplicate
language content is inserted into the accessibility tree.
