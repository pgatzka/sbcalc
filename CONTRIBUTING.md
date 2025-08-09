# Contributing to sbcalc

Thanks for helping improve sbcalc. This document keeps contributions simple and consistent.

## Prerequisites

- Node.js 20+
- pnpm 10+

## Setup

```bash
git clone https://github.com/Hexeption/sbcalc.git
cd sbcalc
pnpm install
```

## Development

- Run everything in dev mode:
  ```bash
  pnpm dev
  ```
- Build all packages:
  ```bash
  pnpm build
  ```
- Lint and format:
  ```bash
  pnpm lint
  pnpm format
  ```

The web app runs at http://localhost:3000.

## Data refresh (NEU)

The app uses data from NotEnoughUpdates (NEU).

- Reclone NEU and regenerate data:
  ```bash
  pnpm run build:clean:neu
  ```
- Clean web build with fresh data:
  ```bash
  pnpm --filter sbcalc-web run build:clean
  ```

Regular dev/build commands in `apps/web` will generate data as part of the run.

## Testing

Some packages include tests (Vitest).

- SNBT parser:
  ```bash
  pnpm --filter @workspace/snbt-parser test
  ```
- Web app tests (no script defined; run Vitest directly):
  ```bash
  pnpm --filter sbcalc-web vitest run
  ```

## Coding guidelines

- TypeScript everywhere; keep types explicit where helpful
- React function components with hooks; co-locate component logic
- Use Tailwind CSS and existing shadcn/ui components
- Keep changes small and focused

## Commit messages

Use Conventional Commits:

- feat: add new feature
- fix: resolve bug
- docs: update docs
- refactor: restructure without behavior change
- test: add or update tests
- chore: tooling/maintenance

Example: `feat: add clean NEU reclone and build scripts`

## Pull requests

- Branch from `main` (e.g., `feat/xyz`, `fix/abc`)
- Ensure build, lint, and tests pass
- Update docs when behavior changes
- Link related issues and keep the PR description short and clear

## Project structure (brief)

- `apps/web/` – Next.js app
- `packages/ui/` – shared UI components
- `packages/neu-recipe-processor/` – pulls/processes NEU data
- `packages/snbt-parser/` – SNBT parser with tests
- `packages/eslint-config/`, `packages/typescript-config/` – shared configs

## License

By contributing, you agree your contributions are licensed under MIT.
