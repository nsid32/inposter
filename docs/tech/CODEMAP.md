# Map of the code

*As of 2026-10-21,* read from the codebase by the "Read what is built" job. What the
technical backlog has not ticketed is listed below as gaps. The product has shipped (v0.4.6,
April 2026) and works end-to-end, but its earlier features (F0001–F0037 in `backlog/`) are
not ticketed in the new Backlog Standard format.

## Layout

```
src/
  app/
    api/
      compose/route.ts         generate 2 post variants from topic + tone + length + hashtags
      dashboard/route.ts       aggregates: total posts, drafts, published this week, recent drafts
      ideas/route.ts           generate 5 fresh post ideas + 1–2 follow-ups from areas of interest
      images/
        [postId]/route.ts      serve a post's picture file with cache headers
        generate/route.ts      generate an image with DALL-E from a prompt or from post text
        unsplash/search/       search Unsplash and attach a stock photo
        unsplash/select/       record user's chosen stock photo
      posts/
        route.ts               GET: list posts (optionally filtered by status)
        [id]/route.ts          GET: single post; PUT: update text/status; DELETE: hard delete
        [id]/image/route.ts    POST: upload image; DELETE: remove image
        [id]/publish/route.ts  POST: send to Make.com webhook, mark published or stay approved
      settings/
        route.ts               GET: all settings (sensitive keys masked); PUT: save settings
        test-ai/route.ts       POST: test Anthropic connection
        test-webhook/route.ts  POST: test Make.com webhook URL
    compose/page.tsx           UI: describe topic, get 2 variants, add picture, save as draft
    queue/page.tsx             UI: three-column board (Drafts, Approved, Published)
    settings/page.tsx          UI: configure keys, preferences, webhook, appearance
    timeline/page.tsx          UI: published posts by month, edit or delete
    page.tsx                   UI: home (Dashboard)
    layout.tsx                 Root layout: sidebar, theme, migrations on mount
  components/
    sidebar.tsx                Navigation, version, theme toggle
    ideas-modal.tsx            "Inspire Me" dialog: show ideas, pick as topic
    unsplash-search-modal.tsx  Modal: search Unsplash, preview, attach photo
    theme-provider.tsx         Dark/light theme context and cookie persistence
    logo.tsx                   Sidebar logo
    ui/                        shadcn/ui: button, input, select, textarea, dialog, etc.
  lib/
    db/
      index.ts                 SQLite setup: WAL mode, Drizzle, migrations on first load
      schema.ts                Drizzle schema: posts, settings tables
      migrate.ts               Apply pending migrations
    settings.ts                get/setSetting (encrypt sensitive keys); getAllSettings
    crypto.ts                  AES-256-GCM encrypt/decrypt; key derived from .env.local ENCRYPTION_KEY
    utils.ts                   Utility functions (Tailwind classnames)
    migrateImages.ts           On-startup: move legacy base64 images from imageData column to files
  globals.css                  Tailwind CSS
drizzle/
  0000_confused_penance.sql    Initial schema (posts, settings tables)
  0001_add_image_columns.sql   Add imagePath, imageMimeType columns (legacy imageData column)
  0002_add_indexes_and_cleanup.sql  Add indexes on status, published_at, created_at
  0003_add_image_path.sql      Alter posts to add image_path column
  meta/_journal.json           Migration history (⚠ missing 0002, 0003; see Gaps)
scripts/
  setup.sh                     One-time setup: initialize .env.local, ENCRYPTION_KEY, database
  run.sh                       Start dev server; apply pending migrations
  release.sh                   Bump semver, update CHANGELOG, commit, tag, push (owner only)
next.config.mjs                Make better-sqlite3 a webpack external; NEXT_PUBLIC_APP_VERSION
package.json                   Dependencies, scripts, version (read by sidebar)
.env.local (generated)         ENCRYPTION_KEY for encrypting sensitive settings
data/
  inposter.db                  SQLite database (gitignored)
  images/                      Post pictures: post-<id>-<timestamp>.<ext> (gitignored)
docs/
  product/                     Product side: what users see and why
  backlog/                     Technical side: tickets, epics, decisions, NFR
  tech/                        This file
backlog/                       History: features F0001–F0037 (older Backlog Standard v1)
```

## Pages and routes

| Route | Method | What it does | Notes |
|---|---|---|---|
| `/` | `GET` | Dashboard: totals, drafts pending, published this week, recent drafts | Client component; fetches `/api/dashboard` |
| `/compose` | `GET` | Compose page: topic, preferences, 2 AI variants, pictures | Client; fetches `/api/compose`, `/api/ideas`, `/api/images/**` |
| `/queue` | `GET` | Three-column board (Drafts, Approved, Published) | Client; fetches `/api/posts`, manages statuses |
| `/timeline` | `GET` | Published posts grouped by month | Client; fetches `/api/posts?status=published` |
| `/settings` | `GET` | Configuration: keys, preferences, Make.com, theme | Client; fetches/updates `/api/settings` |
| `/api/compose` | `POST` | Generate 2 post variants (Claude, JSON parse, avoid clichés) | Input: topic, tone, length, hashtags, emojis, key points, audience, CTA. Output: `{ variants: [{ content: string }] }` |
| `/api/dashboard` | `GET` | Aggregates: total, drafts, this week, 10 recent drafts | Output: `{ total, drafts, publishedThisWeek, recentDrafts }` |
| `/api/ideas` | `POST` | 5 fresh ideas + 1–2 follow-ups from areas of interest and recent posts | Output: `{ ideas: [{title, description}], followUps: [{title, description, basedOn}] }` |
| `/api/posts` | `GET` | List posts; query: `status`, `limit` (max 500), `offset` | Output: `{ posts: [...] }` with `imageData` omitted, `hasImage` added |
| `/api/posts` | `POST` | Create a draft post | Input: `{ content, tone?, imageData?, imageMimeType? }` |
| `/api/posts/[id]` | `GET` | Fetch single post (for editing) | Output: full post with image data |
| `/api/posts/[id]` | `PUT` | Update text and status | Input: `{ content?, status? }` (validate status) |
| `/api/posts/[id]` | `DELETE` | Hard delete (permanent) | Removes post and image file |
| `/api/posts/[id]/image` | `POST` | Upload image (server validates: JPEG/PNG/GIF/WebP, ≤5 MB decoded) | Input: form `file` or JSON `{ image_data, image_mime_type }` |
| `/api/posts/[id]/image` | `DELETE` | Remove post's image | Deletes file from `data/images/` |
| `/api/posts/[id]/publish` | `POST` | Send to Make.com; mark `published` if 2xx, else stay `approved` with error | Payload: post_id, content, tone, published_at, image_data (base64), image_mime_type, image_extension |
| `/api/images/[postId]` | `GET` | Serve post picture file | Cache-Control: private, max-age=3600 |
| `/api/images/generate` | `POST` | Generate image with DALL-E; optionally suggest prompt from post text | Input: `{ content, custom_prompt?, derive_only? }`. Output: `{ image_data, image_mime_type, prompt_used }` |
| `/api/images/unsplash/search` | `POST` | Search Unsplash by query | Input: `{ query }`. Output: `{ results: [{id, urls, user}] }` |
| `/api/images/unsplash/select` | `POST` | Record user's chosen Unsplash photo | Input: `{ post_id, unsplash_id, image_data, image_mime_type }` |
| `/api/settings` | `GET` | All settings; sensitive keys masked as "••••••••••••" | Output: `{ settings: {...} }` |
| `/api/settings` | `PUT` | Save settings; skip masked values (user didn't change them) | Input: `{ settings: {...} }` |
| `/api/settings/test-ai` | `POST` | Verify Anthropic key works with a test call | Output: `{ ok: boolean, message: string }` |
| `/api/settings/test-webhook` | `POST` | Verify Make.com webhook URL is reachable | Output: `{ ok: boolean, message: string }` |

## Database

**Posts table** (`src/lib/db/schema.ts`, `drizzle/0000_confused_penance.sql`):

| Column | Type | Notes |
|---|---|---|
| `id` | int | Primary key, auto-increment |
| `content` | text | Post text |
| `source` | enum | `"ai_generated"` (only source today) |
| `status` | enum | `"draft"`, `"approved"`, `"published"`, `"discarded"` |
| `tone` | text | User's chosen tone from Compose |
| `publishedAt` | text (ISO 8601) | Set when Make.com answers 2xx |
| `imagePath` | text | Relative path to file in `data/images/` (D-04) |
| `imageMimeType` | text | `"image/jpeg"`, `"image/png"`, etc. |
| `imageData` | text | Legacy base64; read-only fallback; migrated to `imagePath` on startup (D-04) |
| `createdAt`, `updatedAt` | text (ISO 8601) | Managed by SQLite defaults |

**Settings table** (`src/lib/db/schema.ts`):

| Column | Type | Notes |
|---|---|---|
| `key` | text | Primary key |
| `value` | text | Plain text or encrypted (see below) |
| `encrypted` | boolean | If true, value is AES-256-GCM encrypted (D-05) |
| `updatedAt` | text (ISO 8601) | |

**Sensitive keys** (always encrypted): `anthropic_api_key`, `make_webhook_api_key`, `openai_api_key`, `unsplash_access_key`.

**Other settings** (stored plain): `default_tone`, `default_length`, `default_hashtags`, `emoji_usage`, `claude_model`, `make_webhook_url`, `areas_of_interest`, `theme`.

Encryption: AES-256-GCM with key derived from `ENCRYPTION_KEY` in `.env.local` using scrypt (D-05).

## Key decisions

See `docs/backlog/DECISIONS.md`:

- **D-01:** Next.js 14 (docs) / 16.2.4 (code) App Router, React 18, TypeScript strict.
- **D-02:** Local-first, single user, no hosting, no auth. Features needing a backend are out of scope.
- **D-03:** SQLite + Drizzle ORM + better-sqlite3, WAL mode, synchronous queries.
- **D-04:** Pictures stored as files on disk (`data/images/post-<id>-<timestamp>.<ext>`), referenced from posts; legacy base64 migrated on startup.
- **D-05:** Sensitive keys encrypted with AES-256-GCM, derived from ENCRYPTION_KEY in `.env.local`.
- **D-06:** Publish to LinkedIn only through user's Make.com scenario; never direct LinkedIn.
- **D-07:** Bring-your-own-key: Claude (Anthropic), DALL-E (OpenAI), stock photos (Unsplash), all optional except Claude.
- **D-08:** Tailwind CSS, shadcn/ui, dark by default, light with cookie-based toggle.
- **D-09:** Conventional Commits; owner releases with `./scripts/release.sh`; agents never push.
- **D-10:** Backlog Standard v2; old `backlog/` folder (F0001–F0037) is history, not converted.

## Gaps between code and backlog

### Migrations not in journal

**Impact: New installs may skip essential migrations.**

- `drizzle/0002_add_indexes_and_cleanup.sql` (adds indexes on `status`, `published_at`, `created_at`) is not listed in `drizzle/meta/_journal.json`.
- `drizzle/0003_add_image_path.sql` is also missing.

**Evidence:** Both files exist in the directory but the journal does not reference them. When
`npm run db:migrate` runs, migrations already in `meta/_journal.json` are skipped; if the journal
is wrong, the migrations are skipped even if the database has not had them applied.

**Action:** When a ticket takes on migrations, verify that the journal is updated correctly and
that fresh installs pass all migrations.

### Next.js upgrade: docs out of step

**Impact: Minor; docs are stale.**

- Code runs Next.js `16.2.4` (from `package.json` and `package-lock.json`, bumped by Dependabot in v0.4.4, April 2026).
- `README.md`, `CLAUDE.md`, and `docs/backlog/DECISIONS.md` still say "Next.js 14".
- eslint config is pinned to `14.2.29` (not bumped).

**Evidence:** `next dev` runs Next 16 but generates no errors related to API changes (e.g.,
`params` and `cookies()` in layouts/routes). Likely forward-compatible.

**Action:** When a ticket updates documentation, confirm that Next.js 16 is intentional and
update all references; decide whether to pin the lint config or bump it.

### No test runner

**Impact: No automated tests possible; first test ticket must set one up.**

- `docs/backlog/README.md` rule 8: "The project has no test runner yet. The first ticket
that needs tests sets one up and records the choice in DECISIONS.md and NFR.md."
- `docs/backlog/NFR.md`, Maintainability: "Every ticket ships with tests" but "not enforceable
yet: no test runner".

**Evidence:** No test files in the codebase; no test runner in `package.json`.

**Action:** The first ticket containing tests will choose a runner (Jest, Vitest, etc.) and
document it.

### App not bound to localhost (potential security issue)

**Impact: If port 3000 is reachable from the network, anyone on the network can use the app.**

- `docs/backlog/NFR.md`, Security and privacy: "Single user, no sign-in; the app is meant to
be reached only from the user's machine. Not enforced: `next dev` is started without
`--hostname` (open point)".
- `scripts/run.sh` runs `npm run dev` without `--hostname localhost`.

**Evidence:** `next dev` defaults to `0.0.0.0`; if the machine is on a network, the port is
reachable from other machines. D-02 assumes local-only access.

**Action:** A ticket on D-02 or operability should bind to `localhost` by default and
document the tradeoff (development convenience vs. network exposure).

### UI accessibility: missing aria-labels

**Impact: Minor; some icon-only buttons are not announced to screen readers.**

- `docs/backlog/NFR.md`, Accessibility: "Icon-only buttons carry an `aria-label`. Review;
not yet true everywhere (picture remove buttons have none)".

**Evidence:** `src/app/queue/page.tsx` and `src/app/compose/page.tsx` have image remove/delete
buttons with only `<X />` icon, no label.

**Action:** When improving accessibility, add `aria-label` to all icon-only buttons.

### Earlier features not ticketed

**Impact: None; they are built and working.**

- Features F0001–F0037 (the old Backlog Standard v1 format) are in the root `backlog/` directory.
- `docs/backlog/README.md` and ROADMAP say they are history and must not be moved, converted or
referenced.
- The product shipped with these features but the technical backlog has no epics or tickets yet.

**Evidence:** `backlog/` exists with feature folders; `docs/backlog/ROADMAP.md` says "There are no
epics yet, on purpose" and lists this as a candidate for planning.

**Action:** Planning may decide to write epics and tickets for maintainability or refactoring
work related to the shipped features, but the standard says not to convert the old folder.

## No blockers to building new tickets

No shipped code blocks tickets. Decisions D-01 through D-10 are locked; functional items may
be written and planned into the first epic whenever the owner is ready.

Version 0.4.6 is the baseline. The product is complete for its original use case (the owner
posting regularly on LinkedIn) and open for what the owner plans next.
