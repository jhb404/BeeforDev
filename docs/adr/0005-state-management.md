# ADR 0005 - State management (intentionally minimal)

**Status:** Accepted
**Date:** 2026-05-13

## Context

Considered Zustand/Redux/TanStack Query for state management. Current pattern: hooks own both UI state (`useState`) and server state (fetch + cache via `useEffect`).

## Decision

Keep current hook-based approach. Do NOT introduce a state library.

## Rationale

- App size is small-medium (~6 features, ~100 components). Hook state composes fine.
- Server state caching needs are simple: in-memory + occasional localStorage. No invalidation graph.
- Component re-render perf is fine; no observed bottleneck.
- Adding a library = new mental model + dependency + migration cost without clear payoff.

## Trigger to revisit

If 3+ of these become true:
- Shared mutations cross 3+ features
- Cache invalidation logic spreads across hooks
- Loading/error/refetch patterns get duplicated heavily
- Background revalidation becomes a feature requirement

Then introduce **TanStack Query** (not Zustand) for server state, keep hooks for UI state.
