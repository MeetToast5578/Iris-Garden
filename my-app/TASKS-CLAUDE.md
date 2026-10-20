# Tasks Claude can do

Checked on 2026-10-20 against the live site (`iris-garden-gules.vercel.app`), the
Vercel and Neon accounts, and the code. Everything here is a code or docs change
that lands as a commit on `claude/trusting-knuth-0dc6wj` and a draft PR. Nothing
is started yet; say which ones to run.

## What the live check found working

- Home, `/shop` (15 bouquets, 4 categories), `/about`, `/account/login`, `robots.txt` all return 200.
- Product photos load from Neon Object Storage through `/api/media/file/*`.
- The Google button renders, so the Google env vars are present.
- Production deploy is `READY` on `main` at `1a0e813`. Database has all 25 tables.

## Do first (security and a live error)

1. **Upgrade vulnerable dependencies.** `npm audit --omit=dev` reports 2 critical, 16 high.
   - `next` 16.3.5 is affected by 7 advisories, including image-optimizer SSRF and ISR cache
     poisoning; fix available at 16.4.2 (not a major bump).
   - `payload` 3.89.0 has 16 advisories, including an auth-collection field access bypass,
     a password-hashing weakness and "RCE through first-register"; `@payloadcms/next` and
     `@payloadcms/storage-s3` are flagged with it.
   - `nodemailer` (high) and `sharp` (high, fixed in 0.35.5) also have fixes.
   - Verify with the Vercel preview build, since a full local build needs a database.
2. **Regenerate the admin import map.** Production logged `getFromImportMap: PayloadComponent
   not found` for `@payloadcms/storage-s3/client#S3ClientUploadHandler` on `/admin` (3 hits).
   `app/(payload)/admin/importMap.js` has no S3 entry. Run `payload generate:importmap` and
   commit the result.
3. **Restrict uploads to raster images.** `collections/Media.ts` accepts `image/*`, which
   includes SVG; Payload has advisories about unsanitised SVG uploads. Limit to
   jpeg, png, webp, avif and gif.

## Next (correctness and hardening)

4. **Make the seed refuse the default password.** `scripts/seed.ts:427-428` falls back to
   `admin@irisgarden.com` / `changeme123`. Make it exit unless `SEED_PASSWORD` is set when
   `DATABASE_URI` is not local.
5. **Fix rate limiting for serverless.** `lib/rateLimit.ts` counts in memory, so on Vercel
   it does not hold between invocations (checkout, contact, order lookup). Move the counter
   to Postgres, using the existing database so no new service is needed. A Redis/Upstash
   version is possible too but needs an account from you (see `TASKS-YOU.md`).
6. **Longer order numbers.** `collections/Orders.ts` builds `IG-<time><3 chars>`. Use a
   random suffix from `crypto` so numbers cannot be guessed from the time.
7. **Fix page metadata.** `og:url` is the site root on every page (seen on `/about` and
   `/account/login`). Set a per-page canonical and `og:url`.
8. **Remove unused packages.** `@neon/env` is in `package.json` but nothing imports it.
   Check `@neon/config` too (only `neon.ts` uses it).

## Docs

9. **Rewrite the stale README.** It still describes SQLite, `public/media` and "swap the
   adapter". Replace with the real setup: Neon Postgres, Neon Object Storage, Vercel,
   `payload migrate` and `migrate:create`, the `SEED_ON_BUILD` flow, and the env var list.
10. **Add a launch checklist** to the README that mirrors `TASKS-YOU.md`.

## Needs your OK before I touch anything outside the repo

11. **Run `npm run check` against a throwaway Neon branch.** The checks need a database and
    I do not want to point them at `production`. I would create a short-lived branch
    (7-day TTL, as in `neon.ts`), run the checks, then delete it.
12. **Read-only data check.** Count products, categories, media, orders and users in Neon
    to confirm the seed ran and your admin user exists.

## Cannot verify from here

- A full local `tsc`, lint or build did not run cleanly in this sandbox (the installed
  `payload` and `next` types were not found, and ESLint could not load its Next parser),
  so I could not confirm a clean local build. Vercel's preview build is the source of truth.
- Checkout, registration and Google login were not exercised end to end, because they
  create real records.
