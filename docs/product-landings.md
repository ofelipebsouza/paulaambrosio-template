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

Layout + Levantamento remains a prelaunch interest dialog that opens the visitor's
own email application; it does not send or store a message itself. The R$37 amount
is the source's expected launch price.

HOST UP defaults to “Inscrições em breve”. Set `HOST_UP_CHECKOUT_URL` in the build
environment only after verifying the direct Hotmart offer for R$49 and approving
the final contents and delivery. Rebuild to activate the purchase CTA and matching
FAQ together. Empty, invalid, marketplace and non-Hotmart destinations keep the
original unavailable state. Discovery links continue to scroll to the offer.
No paid files are added to the public site. See `docs/checkout-release.md`.

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

Checkout defaults to pending. The existing build-time Hotmart configuration can
activate the base and bundle offers independently; see `docs/change-order-checkout.md`.
Without a valid link for the selected offer, the interest dialog only opens a
composed email in the visitor's mail app; nothing is sent or stored by this page.
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


## Search indexing policy

The three advertising landings (`/host-up/`, `/layout-starter-kit/`, and
`/change-order/`, including its language-query variants) emit `noindex, follow`
in their HTML head and are excluded from the XML sitemap. They remain publicly
accessible and linked from `/links/`. Do not disallow their crawling in robots.txt:
crawlers must be able to fetch the page to see the noindex instruction.

This is a configured indexing directive, not proof of immediate removal from
search results. Search engines apply it after recrawling; no Search Console
removal request or confirmation of prior indexing status was performed.
