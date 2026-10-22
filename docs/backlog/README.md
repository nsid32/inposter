# InPoster backlog

This is the build spec. Every ticket here is written to be handed to a fresh Claude Code
session with no other context. It follows the Backlog Standard, version 2, with the settings in
`backlog.yml`.

## How to use this with Claude Code

Start a session in the repository and say:

> Read `docs/backlog/README.md`, `docs/backlog/DECISIONS.md` and the ticket
> `docs/backlog/NN-epic/NNNN-slug.md`. Implement NNNN.

When the ticket builds part of a functional item (`implements`), name the item too:

> Read `docs/backlog/README.md`, `docs/backlog/DECISIONS.md`, the item
> `docs/product/requirements/NN-epic/FR-NNN-slug.md` for what users need, and the ticket
> `docs/backlog/NN-epic/NNNN-slug.md` for what to build. Implement NNNN.

The app copies the right one from any ticket.

If a ticket needs context that isn't in it, the ticket is wrong: fix the ticket, then build.

## How work arrives here

Functional items (`FR-NNN`) are written and approved by a product member in the
worksimplicity-backlog app, under `docs/product/requirements/`. Planning turns approved items into
epics and tickets here. Nobody writes epics or tickets ahead of approved items, except
non-functional work the technical side owns (see `docs/tech/CODEMAP.md`, "Gaps").

## Layout

```
docs/product/        the product side: what it is, for whom, why, and what users need
  GLOSSARY.md        the product's words. Read before naming anything
  requirements/      functional items (FR-NNN): what each ticket builds part of
docs/tech/CODEMAP.md the map of the code: areas, files, names in code
docs/backlog/
  backlog.yml        settings: the standard version, depth, what Done means
  README.md          you are here
  ROADMAP.md         the build order: phases, sequencing, the current cut
  DECISIONS.md       locked technical decisions (D-NN). Read before writing code
  NFR.md             standing non-functional requirements every ticket respects
  NN-epic-slug/
    EPIC.md          why the epic exists, what done means, the tickets not written yet
    NNNN-slug.md     tickets that are not done
  completed/         every ticket whose status is Done
```

`backlog/` at the repository root (features F0001 to F0037, `tech-debt/`, `defect-log.md`) is the
product's history in an older format. Read it for context; never edit, move or convert it, and
never write new work there.

## Epics and numbering

No epics exist yet. Epic `NN` owns tickets `NN00` to `NN99`; epic `00` starts at `0001`. Add a
row here when an epic is created.

| Epic | Directory | Tickets | Next free number |
|---|---|---|---|
| (none yet) | | | 0001 for epic 00 |

## Tickets

Each ticket starts with YAML frontmatter, then `# NNNN — Title`:

```yaml
---
epic: 01-accounts
type: functional          # functional | non-functional
quality: []               # non-functional: performance, reliability, data-integrity, security,
                          # privacy, accessibility, observability, infrastructure, compliance,
                          # maintainability, operability
status: Not started       # Draft | Not started | In progress | Blocked | Done
size: M                   # S | M | L | XL (split an XL before starting)
depends_on: ["0003"]      # authoritative and complete; quote every number
---
```

- Numbers: epic `NN` owns `NN00` to `NN99`. Never renumber; a dropped number stays dead.
- There is no `Blocks:` field. What a ticket blocks is derived from `depends_on`.
- A ticket that is planned but not written is a `### NNNN — Title` entry in its epic's
  `EPIC.md`. Writing its file removes the entry, carrying everything in it.
- Sections: Why, Scope (In and Out), Data model, API surface, UX notes, Acceptance criteria,
  Test cases, Gotchas, Open questions (only about later work), then As built once built.
  Sections that don't apply are removed, not left empty.

## Done

Done means what `backlog.yml`'s `done_definition` says. The commit that sets `status: Done`
also adds `completed: YYYY-MM-DD`, moves the file into `completed/` with `git mv` (same file
name), and adds `## As built (YYYY-MM-DD)`: where the code departs from the listing, and why.

## Rules for writing tickets

1. **Self-contained.** A fresh session must be able to build it.
2. **Acceptance criteria are checkable**, each naming the test that proves it.
3. **Every Out bullet names the ticket that covers it**, or says `not planned`.
4. **No open question blocks building.** If one does, the ticket is a `Draft`.
5. **Carry obligations** to later tickets as **From NNNN (YYYY-MM-DD):** notes.
6. **No ticket ships without tests.**

## Project rules

From the project's own `CLAUDE.md` and `CONTRIBUTING.md`; they apply to every ticket.

1. **Never push.** Agents may commit locally but never run `git push` and never push to `main` or
   any remote. The owner releases with `./scripts/release.sh`.
2. **Conventional Commits** for every commit: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`,
   `BREAKING CHANGE:`. The release script derives the version bump from them.
3. **Local-first scope.** No hosted backend, no multi-tenancy, no sign-in, no marketing pages
   (D-02). A ticket that needs any of these is out of scope until DECISIONS.md says otherwise.
4. **Publishing goes through Make.com only** (D-06). Do not add a direct LinkedIn integration.
   Do not rename or remove fields of the Make.com payload: users' scenarios map them by name.
5. **TypeScript only**, no `any` unless unavoidable; run `npm run lint` before committing.
6. **UI** composes the shadcn/ui components in `src/components/ui/` rather than raw HTML, supports
   both themes (every colour class has its `dark:` pair), and uses the glossary's words on screen.
7. **Schema changes** go through `src/lib/db/schema.ts` and `npm run db:generate`; never edit an
   applied migration. Check that `drizzle/meta/_journal.json` lists the new migration.
8. **Tests.** The project has no test runner yet. The first ticket that needs tests sets one up and
   records the choice in DECISIONS.md and NFR.md; every later ticket uses it.
9. **Keep `CLAUDE.md` current** when a ticket changes pages, scripts or workspace structure (the
   project's own rule).
