# Run doc — Paula Ambrosio Interiors (Astro static site)

## Reproduce artifacts (fresh checkout)

1. Install dependencies (npm; `package-lock.json` is committed):

   ```
   npm install
   ```

2. No `.env` files are required. The only optional variable is `CONTACT_FORM_ENDPOINT`
   (routes the contact form to a CRM/webhook; falls back to `mailto:` when unset) —
   copy values from the main checkout only when integrating the form. Never commit secrets.
3. Content lives in `src/content/**` (MDX + Zod schemas in `src/content.config.ts`);
   design tokens in `src/styles/global.css`. Nothing else needs generating.

## Run the dev server

```
npm run dev
```

- Default port **4321** (Astro default; keep it if free, otherwise pass `--port <n>`).
- Binds `localhost` only (`http://localhost:4321/`); add `--host` to expose on the network.
- Windows detached start (Freebuff preview recipe), with stdout/stderr in separate files:

  ```
  powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"
  ```

- Verify: `netstat -ano | findstr :4321` shows LISTENING, `curl http://localhost:4321/` returns 200,
  and `Get-Process -Id <pid>` confirms survival a few seconds later.

## Verify before deploy

```
npm run build          # static output to dist/ (34 pages)
node scripts/check-links.mjs
npx tsc --noEmit
```

Note: `npx astro check` hangs indefinitely in this environment; use `tsc --noEmit` instead.
