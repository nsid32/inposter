# Contributing to InPoster

InPoster is a local-first personal tool. Contributions are welcome — keep things simple and practical.

---

## Local Setup

Run the one-time setup script to install dependencies, create `.env.local`, and initialise the database:

```bash
./scripts/setup.sh
```

You will need Node.js 18+ and the API keys you intend to use (Anthropic, OpenAI, Unsplash). Follow the prompts in the setup script.

## Running the App

```bash
./scripts/run.sh
```

This starts the Next.js dev server at [http://localhost:3000](http://localhost:3000).

---

## Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | When to use |
|--------|-------------|
| `feat:` | New feature or capability |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `chore:` | Build, config, tooling, deps |
| `refactor:` | Code change with no feature or fix |

Examples:

```
feat: add Unsplash image picker to composer
fix: queue not refreshing after publish
docs: update setup instructions in README
chore: bump next to 14.2
```

---

## Submitting a Pull Request

1. Fork the repository and create a branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes, commit using Conventional Commits.
3. Open a PR against `main` with a clear title and description of what you changed and why.
4. PRs that touch API routes or database schema should include a brief note on how to test the change locally.

---

## Code Style

- Follow the patterns already present in the codebase.
- All new code must be TypeScript — no `any` unless absolutely necessary.
- Run the linter before committing:
  ```bash
  npm run lint
  ```
- UI components use [shadcn/ui](https://ui.shadcn.com/) — prefer composing existing components over writing raw HTML.

---

## Local-First Note

InPoster is designed to run on your own machine — there are no cloud deployment targets, no multi-tenancy, and no authentication layer. Keep contributions scoped to the local-first model. Features that require a hosted backend are out of scope.
