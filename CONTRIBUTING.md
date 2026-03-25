# Contributing to Srinidhi Boutique

Thank you for your interest in contributing!

## Getting Started

1. Fork the repository and clone your fork.
2. Follow the setup steps in [README.md](./README.md#getting-started).
3. Create a feature branch: `git checkout -b feat/your-feature`

## Development Workflow

```bash
npm run dev        # Start store, admin, and API together
npm test           # Run the full test suite (1324+ tests, ~2 min)
```

All three services must start cleanly before opening a PR.

## Making Changes

- **API changes** — add or update route handlers in `server/src/routes/`, update the Prisma schema if needed (`prisma db push`), and write integration tests in `server/src/__tests__/`.
- **Store changes** — work in `web/src/`. Components go in `web/src/components/`, pages in `web/src/app/`.
- **Admin changes** — work in `admin/src/app/admin/`.

## Tests

Write tests for any new API endpoints or behaviour changes. Tests live in `server/src/__tests__/`. Run with:

```bash
npm test
```

All 1324+ tests must pass before submitting a PR. The test suite uses a real PostgreSQL database — no mocks.

## Pull Request Guidelines

- Keep PRs focused on a single feature or fix.
- Write a clear PR description explaining what changed and why.
- Ensure `npm test` passes locally.
- Reference any related issues with `Closes #123`.

## Reporting Issues

Open a GitHub issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Node.js / PostgreSQL version

## Code Style

- TypeScript throughout — no `any` unless unavoidable.
- Tailwind CSS for styling — no inline styles.
- Zod for request validation on all API routes.
- No `console.log` in committed code (use the existing error handling).
