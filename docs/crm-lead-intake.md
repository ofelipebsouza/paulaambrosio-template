# Studio lead intake review

The contact form asks for estimated **project investment**, not studio fees. An answer is required; “Not sure yet” is valid. The city field allows any city and suggests published areas. The source answer is optional; inferred source uses recognized campaign/referrer signals only. Legacy clients and records remain compatible.

| Intake choice | Tag | Default recommendation | Studio notification |
| --- | --- | --- | --- |
| Under $100,000 | T1 | Consultation; Express if selected | Standard |
| $100,000 to $500,000 | T2 | Residential | Standard |
| $500,000 to $1,000,000 | T3 | Turnkey | Priority |
| Over $1,000,000 | T4 | Turnkey | Priority |
| Not sure yet | Unsure | Set after the conversation | Standard |

The chosen band is authoritative at shared range boundaries. Priority bands use a priority subject for the **existing studio inbox**; no new recipient, WhatsApp, or vendor is added. All current replies say the studio calls within 24 hours to arrange the consultation; if the phone is missing, the email asks the visitor to reply with a callback number. No booking URL, payment link, or fee is in the reply. Confirm the office can cover the 24-hour callback promise before merging.

The lead details panel stores editable source, recommended service, next step and Miami calendar date. New leads are marked **Novo contato**, with a next-step date from the 24-hour target in Miami. Existing pipeline stages, first-reply logic and reminder quotas are unchanged. The dashboard shows a last-30-day source-by-band table; the signed-in CSV includes those fields. An unrecognized historical source stays unknown, and unrecognized historical budgets count as Unsure. The table is a lead breakdown, not advertising attribution.

Contact analytics and acceptance receipts remain unchanged. The new intake fields are internal to the CRM and are not included in Hermes responses, external agent payloads or marketing measurement. The source is shown in existing lead email to the studio. No legacy leads are sent new replies.

## Review before release

1. Review the five callback emails, the callback commitment and the priority subject in the offline tests. Keep the PR in draft until Paula reviews.
2. Verify the required field, allowed values, editable CRM detail, no-phone response, source breakdown, and no duplicate email on a receipt retry with the synthetic tests. Do not enter a real submitter in a test.
3. Run `npm run crm:test`, `npm run mail:test` (local SMTP sink only), and `node --test tests/contact-acceptance.test.mjs tests/contact-submission.test.mjs`. The optional real-browser test uses local Astro and mocks every external request: `node tests/contact-browser.test.mjs`.
