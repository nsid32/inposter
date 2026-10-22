# The map of the code

*Read from the code on 2026-10-21 (version 0.4.6, commit 768379d).* Technical side: what is built,
where it lives, and what it is called. What users can do is in `docs/product/STATE.md`. Stack and
other locked choices are in `docs/backlog/DECISIONS.md`.

Single Next.js App Router app under `src/`. Pages are client components (`"use client"`) that call
route handlers under `src/app/api/` with `fetch`; there are no server actions. Route handlers read
and write SQLite synchronously through Drizzle (`src/lib/db`).

## By area

| Area | Main files and routes | Notes |
|---|---|---|
| App shell and navigation | `src/app/layout.tsx`, `src/components/sidebar.tsx`, `src/components/logo.tsx`, `src/app/globals.css`, `tailwind.config.ts` | Root layout reads the `theme` cookie (default `dark`) with `cookies()`, wraps pages in `ThemeProvider` and the sonner `Toaster`, and calls `migrateImagesToFiles()` on every render. Sidebar nav: `/`, `/compose`, `/queue`, `/timeline`, `/settings`; shows `NEXT_PUBLIC_APP_VERSION` (set from `package.json` in `next.config.mjs`) |
| Theme | `src/components/theme-provider.tsx`, Appearance card in `src/app/settings/page.tsx` | `setTheme` toggles the `dark` class, writes the `theme` cookie (1 year) and `PUT /api/settings {theme}` |
| Dashboard | `src/app/page.tsx`; `GET /api/dashboard` (`src/app/api/dashboard/route.ts`) | Counts: all posts (discarded included), drafts, published in last 7 days by `published_at`; five newest drafts (`imageData` stripped) |
| Compose (generate and edit) | `src/app/compose/page.tsx` (`ComposePageInner`, `VariantCard`, `CharCounter`); `POST /api/compose` | Body `ComposeRequest {topic, keyPoints?, audience?, cta?, tone, length, hashtags, emojis}`; `LENGTH_CHARS` short 300, medium 600, long 1300. Calls Anthropic `messages.create` (model from `claude_model`, default `claude-sonnet-4-6`, `max_tokens` 2000) and parses `{"variants":[{"content"}]}` from the text after stripping code fences. Edit mode: `/compose?edit=<id>` loads `GET /api/posts/:id` and the image, saves with `PATCH` then image `POST` or `DELETE`. `MAX_CHARS = 1300` is display only |
| Topic ideas (Inspire Me) | `src/components/ideas-modal.tsx` (`IdeasModal`); `POST /api/ideas` | Uses `areas_of_interest` (comma-separated setting) and the first 200 chars of the last 5 published posts (by insertion order, `.slice(-5)`), `max_tokens` 1500; returns `{ideas[5], followUps[0..2]}` |
| Posts | `GET`/`POST /api/posts` (`src/app/api/posts/route.ts`); `GET`/`PATCH`/`DELETE /api/posts/:id` (`src/app/api/posts/[id]/route.ts`) | List filters by `status`, `limit` default 200 max 500, `offset`; no `ORDER BY`. List and single responses drop `imageData` and add `hasImage`. `POST` requires `application/json` (415 otherwise). `PATCH` accepts `content`, `status`, `tone` with no transition checks |
| Queue (approval and publishing) | `src/app/queue/page.tsx` (`QueuePage`, `PostCard`, `COLUMNS`) | Loads all posts and settings, filters `source === "ai_generated"`; columns draft, approved, published (published filtered client-side by `publishedDays`, default 30). Discarded posts are never shown. AlertDialogs for publish, delete, resend |
| Publishing | `POST /api/posts/:id/publish` (`src/app/api/posts/[id]/publish/route.ts`), `POST /api/settings/test-webhook` | Posts JSON to `make_webhook_url` with optional `x-make-apikey` header. Payload: `post_id`, `content`, `tone`, `published_at`, and when there is an image `image_data` (base64), `image_mime_type`, `image_extension`. Sets `status = published`, `published_at` only on a 2xx; 400 `code: webhook_not_configured`, 502 on non-2xx, 500 on network error. No timeout. Resend reuses the same route. Test payload adds `_test: true`, `post_id: 0` |
| Images: storage and serving | `POST`/`DELETE /api/posts/:id/image` (`src/app/api/posts/[id]/image/route.ts`), `GET /api/images/:postId` (`src/app/api/images/[postId]/route.ts`), `src/lib/migrateImages.ts` | Upload body `{image_data (base64), image_mime_type}`; allowed `image/jpeg`, `image/png`, `image/gif`, `image/webp`; 5 MB decoded. Written to `data/images/post-<id>-<timestamp>.<ext>`, path stored relative in `posts.image_path`, old file unlinked. Legacy `posts.image_data` still read as a fallback; `migrateImagesToFiles()` moves it to files |
| Images: AI generation | `POST /api/images/generate` (`src/app/api/images/generate/route.ts`); generation panel in `VariantCard` | Body `{content, custom_prompt?, derive_only?}`. Without `custom_prompt`, Claude writes the prompt with model hard-coded to `claude-sonnet-4-6` (ignores `claude_model`). Then OpenAI `images.generate` `dall-e-3`, 1024x1024, `response_format: "url"`; fetches the URL and returns base64 `image/png`. Offered in Compose only |
| Images: Unsplash | `src/components/unsplash-search-modal.tsx` (`UnsplashSearchModal`); `POST /api/images/unsplash/search`, `POST /api/images/unsplash/select` | Search: `per_page` 20, `orientation=landscape`, page 1 only from the UI. Select: fires the `download_location` request (fire and forget), fetches `urls.regular`, returns base64. Photographer name is shown in the modal, not stored |
| Settings | `src/app/settings/page.tsx` (`SettingsPage`); `GET`/`PUT /api/settings`, `POST /api/settings/test-ai`; `src/lib/settings.ts` (`getSetting`, `setSetting`, `getAllSettings`, `deleteSetting`) | `GET` masks `SENSITIVE_KEYS` as `MASK` (`••••••••••••`); `PUT {settings: Record<string,string>}` skips masked values and accepts any key. `SENSITIVE_KEYS` is duplicated in `src/lib/settings.ts` and `src/app/api/settings/route.ts` |
| Secrets encryption | `src/lib/crypto.ts` (`encrypt`, `decrypt`) | AES-256-GCM, key `scryptSync(ENCRYPTION_KEY or os.hostname(), "inposter-local-encryption", 32)`; stored as `iv:tag:data` hex. Warns when `ENCRYPTION_KEY` is unset |
| Data store | `src/lib/db/index.ts` (`db`, `schema`), `src/lib/db/schema.ts`, `drizzle/*.sql`, `drizzle/meta/_journal.json`, `drizzle.config.ts`, `src/lib/db/migrate.ts` | `data/inposter.db`, WAL. Tables `settings(key PK, value, encrypted, updated_at)` and `posts(id, content, source, status, tone, published_at, image_path, image_data, image_mime_type, created_at, updated_at)`. Timestamps are ISO strings in `text` columns |
| Setup, run and release | `scripts/setup.sh`, `scripts/run.sh`, `scripts/release.sh`, `.env.example` | `setup.sh`: Node 18+ check, `npm install`, `.env.local` from `.env.example`, generates `ENCRYPTION_KEY` once and re-encrypts settings stored under the hostname key, `npm run db:migrate`. `run.sh`: `db:migrate` then `npm run dev` (the app always runs on the dev server). `release.sh [--dry-run]`: Conventional Commits to semver bump, CHANGELOG, tag, push |
| UI kit | `src/components/ui/*` (shadcn/ui: button, card, input, label, select, textarea, tabs, badge, separator, dropdown-menu, sheet, scroll-area, dialog, switch, alert-dialog), `src/lib/utils.ts` (`cn`), `components.json` | Radix primitives, lucide-react icons, sonner toasts |
| Developer tooling | `.eslintrc.json`, `tsconfig.json` (`strict`, alias `@/*` to `src/*`), `CONTRIBUTING.md`, `CLAUDE.md` (gitignored), `.claude/` (gitignored) | No test runner, no tests, no CI |

## Names in code

| Term | In code |
|---|---|
| Post | `posts` table, `schema.posts`; `Post` interface in pages |
| Status: Draft, Approved, Published, Discarded | `posts.status` enum `"draft" \| "approved" \| "published" \| "discarded"`; `VALID_STATUSES` in `src/app/api/posts/route.ts` |
| Source | `posts.source`, enum `["ai_generated"]` only (the `synced` source was removed with LinkedIn sync) |
| Variant | `Variant { content }`, `VariantCard` in `src/app/compose/page.tsx` |
| Tone | `posts.tone`; values `Professional`, `Conversational`, `Inspirational`, `Provocative`; setting `default_tone` |
| Length | `length` `short` \| `medium` \| `long`, `LENGTH_CHARS`; setting `default_length` |
| Hashtags, emojis | `hashtags`, `emojis` in `ComposeRequest`; settings `default_hashtags`, `emoji_usage` (`"true"`/`"false"`) |
| Inspire Me, fresh idea, follow-up | `IdeasModal`, `POST /api/ideas`, `Idea`, `FollowUp { basedOn }` |
| Areas of interest | setting `areas_of_interest` (comma-separated, max 10 enforced in the UI only) |
| Picture | `posts.image_path`, `posts.image_mime_type`, legacy `posts.image_data`; API fields `image_data`, `image_mime_type`; `hasImage` |
| Image prompt, Suggest | `custom_prompt`, `derive_only`, `prompt_used` in `/api/images/generate` |
| Queue | `/queue`, `QueuePage`, `COLUMNS`, `PostCard` |
| Publish Now, Resend | `POST /api/posts/:id/publish`; `confirmPublish`, `confirmResend` |
| Make.com address, Make.com access key | settings `make_webhook_url`, `make_webhook_api_key` (header `x-make-apikey`) |
| Access keys | settings `anthropic_api_key`, `openai_api_key`, `unsplash_access_key`, `make_webhook_api_key` = `SENSITIVE_KEYS` |
| Model | setting `claude_model`: `claude-sonnet-4-6` (default), `claude-haiku-4-5-20251001` |
| Theme | cookie and setting `theme` (`dark` \| `light`); `useTheme`, `ThemeProvider` |
| Published column range | `publishedDays` state in `QueuePage` (not saved) |

## Gaps between the code and the backlog

There is no ticket yet in `docs/backlog/`. The history is the older feature folder `backlog/`
(F0001 to F0037, 34 files, all `status: completed`; gitignored, local only). Compared with it:

**Feature files marked completed whose code is no longer there (removed on purpose):**
F0003 LinkedIn post sync, F0007 LinkedIn API tier, F0008 engagement stats toggle and the LinkedIn
parts of F0002 and F0005 ("View on LinkedIn" link, LinkedIn Share API) were removed by F0018.
F0005's "schedule them for later" was never built (its own Out of scope excludes it).

**Code that no feature file or decision describes, or that looks wrong:**

- **Migrations 0002 and 0003 are not in `drizzle/meta/_journal.json`.** The journal lists only
  `0000_confused_penance` and `0001_add_image_columns`, and `drizzle-kit migrate` applies what the
  journal lists. A fresh install from `scripts/setup.sh` may therefore lack `posts.image_path` (used
  by every image route) and the three indexes. Verify on a clean clone before anything else.
- `posts` in the data file still has `linkedin_id` (unique index), `linkedin_url`, `likes`,
  `comments`, `shares` from `0000`; `schema.ts` no longer declares them.
- `src/lib/db/migrate.ts` (`runMigrations`) is never called; `DATABASE_URL` in `.env.example` is
  never read (the path is hard-coded in `src/lib/db/index.ts` and `drizzle.config.ts`).
- `next` is `16.2.4` (Dependabot bump, CHANGELOG 0.4.4) while README and CLAUDE.md say Next.js 14
  and `eslint-config-next` is `14.2.29`. Route handlers type `params` as a plain object and read it
  synchronously, and `layout.tsx` calls `cookies()` synchronously. Next.js 15 made both asynchronous, as far as
  recalled from its upgrade guide (https://nextjs.org/docs/app/guides/upgrading/version-15, not
  re-read on 2026-10-21). Check that the app runs on 16 and whether these need `await`.
- `/api/images/generate` hard-codes `claude-sonnet-4-6` for prompt writing instead of
  `claude_model`.
- `migrateImagesToFiles()` runs in the root layout on every page render, scanning all posts.
- `GET /api/posts` has no `ORDER BY`; pages sort on the client. `/api/ideas` picks "last 5
  published" by insertion order, not `published_at`.
- `PUT /api/settings` stores any key it is sent; `PATCH /api/posts/:id` accepts any status
  transition, including `published` without publishing.
- The publish `fetch` has no timeout; a hanging Make.com call holds the request open.
- `scripts/run.sh` starts `next dev` with no `--hostname`, and there is no sign-in. If the dev
  server listens on all network interfaces (it prints a "Network" address when it does; not
  verified on 2026-10-21), anyone who can reach the machine's port 3000 can use the app, including
  publishing. Confirm and decide (see DECISIONS D-02).
- `.gitignore` ignores `CLAUDE.md` and `.claude/`, so the agent rules in CLAUDE.md are local
  only.

**Tickets not started whose work already seems to exist:** none (no tickets yet).
