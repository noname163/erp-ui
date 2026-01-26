# Nexus ERP Admin (Vue 3)

## Stack
- Vite + Vue 3 + TypeScript
- Vue Router + Pinia
- TailwindCSS (local build, not CDN)
- Axios (cookie-based auth)

## Env
Create `.env.development` / `.env.production`:
- Dev (recommended): use same-origin `/api` via Vite proxy (avoids CORS with cookies)
  - `VITE_API_BASE_URL=`
  - `VITE_API_PROXY_TARGET=http://localhost:8080`
- Prod (recommended): use a reverse proxy (Nginx/Ingress) that serves the UI and proxies `/api` to the backend (see `deploy/nginx.conf.example`)

## Run
```bash
npm i
npm run dev
```

## Auth / Authorization
- Login calls: `POST /api/auth/login` (JWT cookie + response body)
- App stores `isAuthenticated` and `activeRole` locally.
- Router enforces `meta.roles` and redirects to `/role` if role not selected.

## Reusable UI components
- `src/components/ui/UiInput.vue`
- `src/components/ui/UiSelect.vue`
- `src/components/ui/UiButton.vue`
- `src/styles/tailwind.css` includes extracted reusable class tokens:
  - `.ui-card`, `.ui-btn-primary`, `.ui-input`, `.ui-select`, ...

## API mapping
See `src/services/*` (matches the OpenAPI paths you provided).
