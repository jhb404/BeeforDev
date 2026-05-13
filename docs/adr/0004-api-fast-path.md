# ADR 0004 - Dual path: fast API + UI fallback for automation

**Status:** Accepted
**Date:** 2026-05-13

## Context

Browser automation via Playwright is slow and fragile. Beefor exposes a REST API callable directly from `page.evaluate`.

## Decision

Each action (fetch timesheet, lancar hora) tries the direct API path first. If it fails, falls back to UI automation. API path is ~10x faster and more reliable.

## Consequences

Happy path is fast. UI path catches API changes. Two code paths to maintain, but the fallback is the original unchanged code.
