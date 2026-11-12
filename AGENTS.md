# Project Contract: agent-loop-test

## Test & Lint Commands
- `npm test`: Run all unit tests with `node --test`
- `npm run lint`: Syntax check all JS modules with `node --check`

## Directory Structure
- `src/`: Core implementation modules (`math.mjs`, `unrelated.mjs`)
- `test/`: Unit test files named `*.test.mjs`
- `docs/`: Architecture specifications and guides
- `scripts/`: Operational tools including `c18-audit.mjs`

## Coding Standards & Governance Rules
- Pure ESM modules (`import`/`export`), strict Node.js 22 built-ins only.
- Strict zero external npm dependency policy.
- All calculation inputs must be finite numbers; throw `TypeError` otherwise.
- Never use auto-close keywords (`Closes #`, `Fixes #`, `Resolves #`) in PR title, body, or commits. Use `Refs #<id>` instead.
- Existing test files in `test/` are locked and cannot be modified without `--allow-test-modify`.
- Out-of-scope files cannot be modified without explicit `--allowed-paths`.
- Before submitting code, run `/deslop` to remove obsolete comments and boilerplate.
