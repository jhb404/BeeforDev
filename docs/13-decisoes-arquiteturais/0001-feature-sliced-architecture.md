# ADR 0001 - Feature-sliced architecture

**Status:** Accepted
**Date:** 2026-05-13

## Context

App grew past flat component structure. Needed clear separation between generic UI atoms and domain-specific logic.

## Decision

Adopted feature-sliced design:
- `components/common` - reusable atoms (Icons, FunnyLoader, StatusBadge)
- `components/layout` - page-level layout (TitleBar, StartupOverlay)
- `components/ui` - headless primitives (ModalShell)
- `features/<domain>/` - everything for a domain: components + hooks + utils together

## Consequences

Each domain is self-contained. Adding/removing a feature does not touch unrelated folders.
