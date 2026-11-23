# Structure Policy

This document describes how to organize and extend Flowboard's source tree.

## Project boundaries

- Keep application-wide setup in `src/app/`: route composition, Redux store, shared paths, and typed Redux hooks.
- Keep reusable page chrome in `src/layouts/`: the authenticated shell, navigation, top bar, and shell-level dialogs.
- Keep route guards in `src/routes/`. Guards should handle access and workspace prerequisites, not feature presentation.
- Organize product behavior under `src/features/<feature>/` (for example `projects`, `tasks`, `workspace`, `members`, `auth`, `dashboard`, and `inbox`).
- Keep generic, feature-independent UI in `src/components/ui/`. A component tied to a feature belongs in that feature's `components/` directory.
- Keep global CSS in `src/styles/`, runtime configuration in `src/configs/`, and small shared helpers in `src/lib/`.

## Feature layout

Use only the directories a feature needs. The established feature pattern is:

```text
src/features/<feature>/
  api/          # HTTP or service calls
  components/   # Feature-specific UI pieces
  hooks/        # Feature-facing React hooks
  pages/        # Route-level screens
  routes/       # Route definitions for the feature
  store/        # Redux slices and async thunks
  types/        # Feature data and API types
```

- Keep API access in `api/`; do not call Axios or Firebase directly from page components.
- Put feature data fetching and state transitions in its `store/` and expose convenient access through `hooks/` where appropriate.
- Keep route screens focused on composition and user interaction. Extract substantial, reusable feature UI into `components/`.
- Keep types close to the feature that owns them. Promote a type to a shared location only when more than one feature truly owns or uses the concept.
- Avoid creating generic abstractions for one-off UI or moving feature code into global folders merely to shorten imports.

## Routing and state

- Define route paths in `src/app/paths.ts`; use `PATHS` instead of scattering route strings through the UI.
- Define feature routes in that feature's `routes/` directory and compose them in `src/app/routes.tsx`.
- Keep authentication and workspace access checks in the existing route guards and workspace gate.
- Register Redux reducers in `src/app/store.ts`. Keep each domain's slice and async thunks within its feature.
- Use the typed Redux hooks from `src/app/hooks.ts` in React components.

## Styling and responsive behavior

- Use Tailwind utility classes for component-level styling and `src/styles/globals.css` only for global rules or shared utilities.
- Follow the existing dark visual theme and reuse shared UI components when they fit.
- Design layouts mobile-first. Keep content within the viewport, provide touch-usable controls, and make intentionally wide tables or boards scroll within their own region.
- Do not use page-wide horizontal overflow as a substitute for responsive layout.
- Keep presentation changes separate from data or permission logic unless the feature requires both.

## Changes and maintenance

- Prefer a small change within the owning feature over cross-feature coupling.
- Do not duplicate API, permission, or routing rules across pages; use the feature's existing helpers and constants.
- Preserve existing route behavior and Redux contracts when reorganizing code.
- Update this policy and `project_context.md` when the architecture or established conventions materially change.
