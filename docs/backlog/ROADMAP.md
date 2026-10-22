# Roadmap

The build order. This is the technical side's plan, not the product roadmap.

**There are no epics yet, on purpose.** Functional items are written and approved by a product
member in the worksimplicity-backlog app, under `docs/product/requirements/`. Planning then turns
approved items into epics and tickets here, and this file gets its phases. Until then nothing is
scheduled. What is already built is recorded in `docs/product/STATE.md` and
`docs/tech/CODEMAP.md`, not ticketed.

## The current cut

None. The product has no current milestone yet (see `docs/product/GOALS.md`).

| Epic | How much | Why |
|---|---|---|

## Phases

None yet.

| Phase | Epic | What it gets you |
|---|---|---|

## Candidates for the first technical work

Not epics and not commitments: findings from reading the code on 2026-10-21 that planning should
weigh when the first epics are made. Details in `docs/tech/CODEMAP.md`, "Gaps".

- Fresh installs may miss migrations 0002 and 0003 (not in `drizzle/meta/_journal.json`).
- Next.js 16 with code written for 14: confirm the app runs and whether `params` and `cookies()`
  need `await`.
- No test runner; the first ticket with tests sets one up (README, project rule 8).

## What is deliberately not being built

| Not building | Why | Revisit when |
|---|---|---|
| A hosted version, sign-in or several users | Local-first personal tool (D-02, `CONTRIBUTING.md`) | The owner decides InPoster serves people who cannot run it themselves |
| Direct LinkedIn connection, post sync, engagement stats | Built and removed in F0018: LinkedIn restricts the access to a separate approved app (D-06) | LinkedIn access for individuals changes |
| Converting the old `backlog/` folder | It is history; the owner asked to leave it as it is | Never |
