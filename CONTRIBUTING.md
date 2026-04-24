# Contributing to Zeus

Thanks for helping make Zeus better. This project is intentionally local-first, small enough to understand, and strict about safety around user-created tools.

## Development Setup

```bash
npm install
npm run verify
npm run start -- --help
```

`npm run verify` runs typecheck, tests, and the production bundle.

## Project Layout

- `src/cli.ts`: command routing and CLI entrypoint
- `src/interactive.ts`: interactive shell
- `src/config/`: local Zeus workspace setup
- `src/inference/`: model provider adapters
- `src/search/`: search provider adapters
- `src/skills/`: declarative skill manifests and execution
- `src/tools/`: executable tool manifests and runtime safety
- `test/`: Node test runner coverage

## Pull Request Expectations

- Keep changes focused and explain the user-facing behavior.
- Add or update tests for behavior changes.
- Run `npm run verify` before opening a PR.
- Do not commit `node_modules`, `dist`, secrets, local config, or generated caches.
- Preserve the safe-by-default tool execution posture.

## Design Principles

- Local-first by default.
- User data stays on the user's machine unless they opt into a provider.
- Skills should be easy to author and validate.
- Tools should be explicit about permissions and safe to install.
- CLI commands should remain scriptable even as interactive mode improves.

## Reporting Security Issues

Please do not open a public issue for vulnerabilities. See `SECURITY.md`.
