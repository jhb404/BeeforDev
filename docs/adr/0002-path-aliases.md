# ADR 0002 - Path aliases (@shared, @main, @automation, @renderer)

**Status:** Accepted
**Date:** 2026-05-13

## Context

Deep relative imports (`../../../../shared/types`) made refactors painful and obscured module boundaries.

## Decision

Added path aliases in `tsconfig.json`, `tsconfig.main.json`, and `vite.config.ts`:
- `@shared/*` -> `src/shared/*`
- `@main/*` -> `src/main/*`
- `@automation/*` -> `src/automation/*`
- `@renderer/*` -> `src/renderer/*`

ESLint `no-restricted-imports` rule enforces `@shared/` usage - relative paths to shared/ are errors.

## Consequences

Imports are stable across file moves. Boundary violations are caught at lint time.
