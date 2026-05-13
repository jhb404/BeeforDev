# ADR 0003 - Typed IPC client wrappers

**Status:** Accepted
**Date:** 2026-05-13

## Context

`window.beefor.*` calls were spread across components, hooks, and pages with no central registry of IPC channels.

## Decision

Created `services/ipc/` with one client file per domain (session, settings, timesheet, kudo, mood, team, coin2u, system, credentials). Each file wraps `window.beefor.*` with typed functions.

## Consequences

All IPC calls go through one layer. Easy to mock in tests. Rename a channel in one place.
