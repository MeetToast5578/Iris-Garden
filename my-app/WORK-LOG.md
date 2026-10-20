# Work log

Claude's running log for the items in `TASKS-CLAUDE.md`. Each entry says what was
done, how it was reviewed, and what is left. Newest entries at the bottom.

Branch: `claude/trusting-knuth-0dc6wj` (restarted from `main` after PR #2 merged).

---

## 1. Upgrade vulnerable dependencies — done

**Why:** `npm audit --omit=dev` reported 2 critical and 13 high (`next` 16.3.5,
`payload` 3.89.0, `nodemailer`, `sharp`).

**What changed**
- `next` 16.3.5 -> 16.4.2, `eslint-config-next` 16.3.5 -> 16.4.2.
- `payload` and every `@payloadcms/*` package (including `storage-s3`) -> 3.91.0,
  pinned exactly because each Payload package peer-depends on the exact same
  `payload` version.
- `sharp` 0.35.4 -> 0.35.5 (pinned).
- `nodemailer` is a transitive dependency; it now resolves to 10.1.7 through
  `@payloadcms/email-nodemailer` 3.91.0.
- `package-lock.json` was regenerated from scratch. An in-place `npm install` failed
  with `ERESOLVE` because the old lockfile held `payload@3.89.0` against the new
  exact peer. This makes the lockfile diff large (about 8k lines); only the dependency
  versions above were changed on purpose.

**Review**
- `npm ci` from a clean `node_modules`: installs, 748 packages.
- `npx tsc --noEmit`: exit 0.
- `npx eslint`: 0 errors, 4 warnings, all in the generated
  `migrations/20261014_172117_initial.ts` (unused `payload`/`req` args; left alone).
- `npm audit --omit=dev`: 27 -> 17 total; critical 2 -> 0, high 13 -> 10.

**Left over (no upstream fix yet):** 10 high advisories remain, all in Payload's own
tooling chain: `sass` via `@payloadcms/next`, `braces`/`micromatch`/`find-node-modules`
via `@payloadcms/plugin-cloud-storage`; `esbuild` (moderate) comes via `drizzle-kit`. They are dev and
build-time packages, not code that handles customer requests. Re-check after the next
Payload release.

**Not verified:** a full `next build` and `npm run check` need a database; the Vercel
preview build on the PR is the check for those.

---

## 2. Regenerate the admin import map — done

**Why:** production logged `getFromImportMap: PayloadComponent not found` for
`@payloadcms/storage-s3/client#S3ClientUploadHandler` on `/admin`.

**What changed:** ran `payload generate:importmap` (with dummy `PAYLOAD_SECRET` and
`DATABASE_URI`, and no S3 keys, which matches the `enabled: false` case in the error).
`app/(payload)/admin/importMap.js` gains exactly one import and one map entry for
`S3ClientUploadHandler`.

**Review:** diff read line by line: 3 added lines and 1 changed (a trailing comma), nothing
else. `tsc` passes.

---
## 3. Restrict uploads to raster images — done

`collections/Media.ts`: `mimeTypes` was `image/*` (includes SVG, which Payload has
sanitisation advisories for). Now jpeg, png, webp, avif, gif. The seed uploads JPEGs, so it
is unaffected. **Review:** `tsc` passes. Existing media is untouched.

## 4. Seed password guard — done

`scripts/seed.ts`:
- Throws before deleting anything when `DATABASE_URI` is not localhost/127.0.0.1 and
  `SEED_PASSWORD` is unset.
- **Extra find:** the seed printed `email / password` to the log. On Vercel that puts the
  real admin password in build logs. It now prints the password only when it is the repo's
  public default.

**Review:** ran the seed with a remote-looking `DATABASE_URI` and no `SEED_PASSWORD`; it
failed immediately with the new error and touched nothing. Checked the host regex on five
URIs (localhost, 127.0.0.1, Neon pooler, `localhost.evil.com`, unset); only the first two
count as local.

## 5. Rate limiting in Postgres — done, one thing to confirm after deploy

**What changed**
- New hidden `rate-limits` collection (`collections/RateLimits.ts`): `key`, `windowStart`,
  `count`, unique on (`key`, `windowStart`); all API access denied.
- `lib/rateLimit.ts` does one atomic `INSERT ... ON CONFLICT DO UPDATE ... RETURNING count`
  per call and compares against `max`. Same function signature, so the five callers
  (register, sign in, order lookup, checkout, contact) are unchanged. A failure in the
  limiter logs and allows the request. Old windows are swept on about 1 call in 100.
- Migration `20261020_111405_rate_limits` (generated offline with `payload migrate:create`).
  **It also adds `reset_password_requested_at` to `customers` and `users`.** That is not
  from this feature: Payload 3.91 (item 1) expects those columns, so the upgrade needs this
  migration in the same deploy. Both changes are additive and nullable.

**Review**
- Read the generated SQL: table `rate_limits(key, window_start, count)` matches the raw
  query, and the unique index backs `ON CONFLICT`.
- Ran the exact upsert against an in-memory Postgres (PGlite): with `max = 3` the calls
  return allowed, allowed, allowed, blocked, blocked; a different IP and the next window
  each start fresh; 10 concurrent hits counted 1 to 10 with no duplicates.
- `tsc` passes; types regenerated (`payload-types.ts`).

**Not verified / risks**
- Not run against Neon from here. After the preview build, 11 wrong sign-ins from one IP
  should be blocked on the 11th (this creates no records).
- Vercel preview builds run `payload migrate` against the same `DATABASE_URI` as
  production, so the PR's preview build will apply this migration to the live database
  before merge. It only adds a table and two nullable columns.
- Fixed windows allow up to 2x `max` across a boundary (noted in code).

## 6. Order numbers from random bits — done

`collections/Orders.ts`: `IG-<time><3 random chars>` -> `IG-` plus 10 hex characters from
`crypto.randomUUID()` (40 bits, not derived from the clock). The unique index already
exists. `components/OrderLookupForm.tsx` placeholder widened to 10 characters.
Nothing validates the old length (grepped all uses). Existing orders keep their numbers.
**Review:** generated a sample and matched `^IG-[0-9A-F]{10}$`; `tsc` passes.

## 7. Page metadata — done

The root layout set `openGraph.url` to the site root; Next merges metadata shallowly, so
every page without its own `openGraph` (about, contact, login...) inherited it. Removed it
from `app/(frontend)/layout.tsx`, and added `alternates.canonical` to product
(`/product/<slug>`) and category (`/shop/<slug>`) pages, resolved against `metadataBase`.
**Review:** read the Next 16 docs shipped in `node_modules/next/dist/docs` for the merge
rule; `tsc` passes. Not checked in a browser: confirm with view-source on the preview.

## 8. Unused packages — done

`@neon/env`: nothing imports it, removed. `@neon/config`: only `neon.ts` (Neon CLI
config) uses it, moved to `devDependencies` (Vercel installs those, and `tsc` still sees
it). **Review:** `tsc` and `eslint` pass; `npm ls` shows no invalid packages.

## 9 and 10. README and launch checklist — done

`README.md` now describes the real setup: Postgres on Neon, Neon Object Storage, Vercel,
the `vercel-build` script, migrations (including the preview-shares-production-database
warning), the full env var table, the one-time `SEED_ON_BUILD` flow, and a refreshed
"Before this goes live" list that mirrors `TASKS-YOU.md`. No mention of SQLite remains.
**Review:** re-read against `payload.config.ts`, `package.json`, `.env.example`, and
`vercel-build`; the commands and variable names match.

---

## Still open

- **Item 11** (`npm run check` against a throwaway Neon branch) and **item 12** (read-only
  row counts in Neon): need your OK before I touch Neon.
- Everything in `TASKS-YOU.md`.
- A full `next build`, `npm run check` and a live test of the limiter have not been run.
  The Vercel preview build for the PR is the first real build of these changes.
