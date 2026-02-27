# Auto Garage (Auto_Garrage)

A simple booking and staff management web application for an auto garage. This repo uses a React + Vite frontend (TypeScript + Tailwind) with JavaScript/Supabase-based data and authentication flows.

Key features
- Booking creation and management
- Staff listing and admin pages
- Responsive UI built with Tailwind CSS
- Supabase-based authentication and data persistence

Tech stack
- Frontend: Vite, React, TypeScript, Tailwind CSS
- Backend services: Supabase
- Database: Supabase PostgreSQL
- Tests: Vitest (unit tests for utilities and schemas)

Repository layout
- `src/` — React app source (components, pages, hooks, lib)
- `docs/` — setup notes and SQL files
- `public/` — static assets
- `tests/` — Vitest unit tests

Quick start

Prerequisites
- Node.js (>=18)
- npm or yarn
- Supabase project credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

Local frontend development

1. Install dependencies

```bash
npm install
```

2. Run the dev server

```bash
npm run dev
```

3. Open the app in the browser (Vite will show the URL, typically `http://localhost:5173`)

Environment
- Add Supabase values to your local env file:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Build for production

```bash
npm run build
npx serve -s dist
```

Replace `serve` with your preferred static file server or deploy to a platform that serves the `dist/` folder.

Tests

Run unit tests with Vitest:

```bash
npm run test
```

Documentation
- API details and DB setup are in the `docs/` folder.

Supabase demo data
- Run schema first in Supabase SQL Editor: `docs/SUPABASE_FULL_SINGLE_SETUP.sql`
- Run demo seed SQL: `docs/SUPABASE_DEMO_SEED.sql` (it auto-creates missing demo auth users)
- Demo rows are inserted for users/profiles, garage, staff, services, bookings, tasks, inventory, and time logs.

Contributing
- Open an issue or create a pull request. Keep changes focused and add tests for new logic when possible.

License
- See `package.json` for license information.

If you'd like, I can run the test suite or create a small CONTRIBUTING.md next.
