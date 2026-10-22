# Roadmap

The build order. This is the technical side's plan, not the product roadmap.

Functional items are written and approved by a product member in the worksimplicity-backlog app,
under `docs/product/requirements/`. Planning then turns approved items into epics and tickets
here. What is already built is recorded in `docs/product/STATE.md` and `docs/tech/CODEMAP.md`,
not ticketed.

## The current cut

**Phase 1: Setup & Onboarding.** A newcomer can set up InPoster and publish their first post in
one session without frustration. This addresses goal G5 ("A newcomer can set it up alone") and
fixes the pain point for self-hosting professionals: Make.com setup errors currently only appear
at publish time. Phase 1 brings validation earlier and guides the user through the setup
checklist.

| Epic | How much | Why |
|---|---|---|
| 00-onboarding | 5 tickets (2 written, 3 planned) | G5: newcomer setup; self-hosters can validate Make.com before publishing |

## Phases

| Phase | Epic | What it gets you |
|---|---|---|
| 1 | 00 | Newcomers can set up without fear and publish their first post in one session |

## Candidates for later phases

- **Phase 2: Publishing Reliability (G3).** Better error messages and recovery when Make.com fails during publish. Retry logic, detailed failures, undo and resend.
- **Phase 3: Ideas & Inspiration (G2).** Richer "Inspire Me" topic suggestions, idea history, favorites, research integration.
- **Phase 4: Compose Quality (G1).** Faster generation, draft templates, batch operations, reusable tone settings.
- **Foundation work:** Fix gaps identified in `docs/tech/CODEMAP.md` (migrations, Next.js docs, test runner, localhost binding, aria-labels).

## What is deliberately not being built

| Not building | Why | Revisit when |
|---|---|---|
| A hosted version, sign-in or several users | Local-first personal tool (D-02, `CONTRIBUTING.md`) | The owner decides InPoster serves people who cannot run it themselves |
| Direct LinkedIn connection, post sync, engagement stats | Built and removed in F0018: LinkedIn restricts the access to a separate approved app (D-06) | LinkedIn access for individuals changes |
| Converting the old `backlog/` folder | It is history; the owner asked to leave it as it is | Never |
