# Architecture Specification - agent-loop-test

## Module Responsibilities
- `src/math.mjs`: Pure math utilities (`add`, `subtract`, future mathematical operations).
- `src/unrelated.mjs`: Formatting helper module for testing scope boundary enforcement.

## Validation Contract
- All numeric arguments must be verified with `Number.isFinite`.
- Any non-numeric, `NaN`, or infinite values must immediately throw `TypeError`.

## Security & Governance (C-18)
- Baseline integrity is enforced via `scripts/c18-audit.mjs` in L0 CI.
- Modifications to CI workflows, governance docs, or existing tests are blocked by default.
