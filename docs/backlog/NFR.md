# Non-functional requirements

Standing rules every ticket respects. A ticket that sets a new one adds its row here. Each row
says where it is defined and what enforces it; "Review" means nothing automated catches it yet.

Recorded from the code and the project's documents on 2026-10-21. The project has no automated
tests and no CI, so today almost every row is enforced by review or by the code itself.

## Performance

| Requirement | Defined in | Enforced by |
|---|---|---|
| List and summary responses never include picture bytes: `imageData` is dropped and `hasImage` added | `src/app/api/posts/route.ts`, `src/app/api/posts/[id]/route.ts`, `src/app/api/dashboard/route.ts` | Review |
| Pictures are served as files by `GET /api/images/:postId` with `Cache-Control: private, max-age=3600`, not inlined in lists | `src/app/api/images/[postId]/route.ts` (D-04) | Review |
| `GET /api/posts` returns at most 500 rows (default 200) | `src/app/api/posts/route.ts` | Code |
| Filters on `posts.status`, `published_at` and `created_at` are indexed | `drizzle/0002_add_indexes_and_cleanup.sql` | Not enforced: 0002 is missing from `drizzle/meta/_journal.json` (see `docs/tech/CODEMAP.md`, "Gaps") |

## Reliability

| Requirement | Defined in | Enforced by |
|---|---|---|
| A post becomes `published` only after Make.com answers 2xx; on any failure it stays `approved` and the user sees the reason | `src/app/api/posts/[id]/publish/route.ts` (D-06) | Code; Review |
| A missing or unreadable picture file never blocks publishing; the post goes out as text | `src/app/api/posts/[id]/publish/route.ts` | Code |
| Pending migrations are applied on every start and on setup | `scripts/run.sh`, `scripts/setup.sh` (D-03) | Scripts |
| `scripts/setup.sh` is safe to run again: it never regenerates an existing `ENCRYPTION_KEY` | `scripts/setup.sh` (D-05) | Script |
| Every route handler catches errors and returns `{ error }` with a 4xx or 5xx status, never an unhandled exception | All `src/app/api/**/route.ts` | Review |

## Security and privacy

| Requirement | Defined in | Enforced by |
|---|---|---|
| Access keys (`SENSITIVE_KEYS`) are stored encrypted (AES-256-GCM) and never returned to the browser; `GET /api/settings` masks them | `src/lib/settings.ts`, `src/lib/crypto.ts`, `src/app/api/settings/route.ts` (D-05) | Code; Review. A new key setting must be added to both `SENSITIVE_KEYS` lists |
| All calls to Anthropic, OpenAI, Unsplash and Make.com are made server-side; keys never reach client code | Route handlers under `src/app/api/` (D-07) | Review |
| No outbound request the user did not trigger; no telemetry, analytics or accounts | `README.md`, "Privacy" | Review |
| Posts, pictures, settings and secrets never enter git: `data/`, `*.db*`, `.env`, `.env.local` are ignored | `.gitignore` | `.gitignore` |
| Uploaded pictures are limited to JPEG, PNG, GIF and WebP, 5 MB decoded, checked on the server as well as in the browser | `src/app/api/posts/[id]/image/route.ts` | Code |
| Picture files are deleted through `path.basename` of the stored path, inside `data/images/` only | `src/app/api/posts/[id]/image/route.ts` | Review |
| Routes that take a post id reject non-numeric ids with 400 and unknown ids with 404 | `src/app/api/posts/**`, `src/app/api/images/[postId]/route.ts` | Review |
| Single user, no sign-in; the app is meant to be reached only from the user's machine | D-02 | Not enforced: `next dev` is started without `--hostname` (open point in `docs/tech/CODEMAP.md`) |

## Accessibility

| Requirement | Defined in | Enforced by |
|---|---|---|
| Interactive elements use the Radix-based shadcn/ui components (keyboard and focus handling come with them) | `src/components/ui/`, `CONTRIBUTING.md` | Review |
| Icon-only buttons carry an `aria-label` | Sidebar menu and theme buttons (`src/components/sidebar.tsx`) | Review; not yet true everywhere (picture remove buttons have none) |
| Both themes are complete: every colour class has its `dark:` counterpart | D-08 | Review |

No accessibility level (such as WCAG 2.1 AA) has been set. Open for the owner.

## Observability and operations

| Requirement | Defined in | Enforced by |
|---|---|---|
| Errors are logged to the server console with the route's name (`"Publish error:"`, `"[InPoster] ..."`); no remote logging, by design | Route handlers, `src/lib/crypto.ts`, `src/lib/migrateImages.ts` | Review |
| Users can check each connection from Settings before relying on it (Test Connection for Anthropic, Test Webhook for Make.com) | `src/app/api/settings/test-ai/route.ts`, `src/app/api/settings/test-webhook/route.ts` | Code |
| The running version is visible in the sidebar | `next.config.mjs` (`NEXT_PUBLIC_APP_VERSION`), `src/components/sidebar.tsx` | Code |
| Setup and run need only `./scripts/setup.sh` and `./scripts/run.sh`; everything else is configured in Settings, never by editing files | `README.md`, `scripts/` | Review |

## Maintainability

| Requirement | Defined in | Enforced by |
|---|---|---|
| TypeScript `strict`; no `any` unless unavoidable | `tsconfig.json`, `CONTRIBUTING.md` | Review. `next build` type-checks, but the app runs on the dev server, so nothing runs a build routinely |
| `npm run lint` passes before every commit | `CONTRIBUTING.md` | Manual. Builds ignore lint (`eslint.ignoreDuringBuilds` in `next.config.mjs`) |
| Conventional Commits; agents never push | `CLAUDE.md`, `CONTRIBUTING.md` (D-09) | `scripts/release.sh` relies on it; Review |
| Schema changes only through `schema.ts` and `npm run db:generate`; applied migrations are never edited; the journal lists every migration | D-03 | Review |
| Every ticket ships with tests | Backlog Standard, `docs/backlog/README.md` rule 8 | Not enforceable yet: no test runner. The first ticket with tests sets one up and adds its row here |
| UI text uses the words in `docs/product/GLOSSARY.md` | `docs/backlog/README.md` | Review |
| `CLAUDE.md` is updated when pages, scripts or structure change | `CLAUDE.md` | Review |
