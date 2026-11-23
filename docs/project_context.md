# Flowboard Project Context

## Overview

Flowboard is a browser-based team workspace and project/task management application. The current frontend is a single-page React app built with Vite and TypeScript. It includes authentication, workspace onboarding and selection, project management, task lists and boards, member invitations, a dashboard, and an inbox route.

The repository contains the frontend application. A backend/API is accessed through the configured Axios client; this source tree does not define the server implementation.

## Technology

- React 19 with TypeScript
- Vite for development and production builds
- React Router for client-side routes
- Redux Toolkit and React Redux for shared application state
- Axios for API requests
- Firebase for authentication integration
- Tailwind CSS 4 through the Vite plugin
- Lucide React for icons
- dnd-kit for task board interactions

## Application flow

`src/main.tsx` mounts the application. `src/app/app.tsx` provides the app-level providers and route rendering. `src/app/routes.tsx` composes public auth routes and protected workspace routes. Protected views pass through authentication and workspace gates before rendering inside the main shell.

The main shell in `src/layouts/` provides the top bar, sidebar, page outlet, and mobile navigation. Feature route definitions live beside their feature. `src/app/paths.ts` is the shared route path map.

## Features and ownership

- `auth`: login/signup screens, auth API, state, and auth hook.
- `workspace`: workspace onboarding, API, types, Redux state, and workspace hook.
- `projects`: project pages, details, project UI, API, types, state, and project hook.
- `tasks`: personal and project task screens, list/board views, task details/comments/attachments, API, types, state, and task helpers.
- `members`: membership API, invitation UI, state, and project member hook.
- `dashboard`: workspace home/dashboard screen.
- `inbox`: inbox route and screen (currently a minimal placeholder view).

Shared application state is configured in `src/app/store.ts`. Its current domains are auth, workspace, projects, tasks, and members. API and runtime configuration is under `src/configs/`; global styles are under `src/styles/`.

## Routes

The current route path constants are:

- `/` — dashboard/home
- `/inbox` — inbox
- `/tasks` — My tasks
- `/projects` — project list
- `/projects/new` — create project
- `/projects/:id` — project detail
- `/portfolios` — currently routed to the not-found view
- `/login` and `/signup` — public auth screens
- `/onboarding` — workspace onboarding

Auth and workspace access are protected by route wrappers. When adding a route, update the feature route file and use `PATHS` for navigation and links.

## Development commands

Run these from the repository root:

```sh
npm run dev       # Start Vite development server
npm run build     # Build production assets
npm run preview   # Preview a production build
npm run lint      # Run ESLint
npm run typecheck # Run TypeScript without emitting files
```

## Working assumptions

- Treat this repository as the frontend unless backend code is added explicitly.
- Keep feature behavior and API interactions within their owning feature.
- Preserve the dark theme and responsive layouts used by the authenticated shell.
- Check the relevant feature routes, API, store, and hooks before changing behavior so the existing data flow remains consistent.
- This file describes the codebase as it exists today; revise it when routes, feature ownership, or core technologies change.
