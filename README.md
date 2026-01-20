# Auto Garage (Auto_Garrage)

A simple booking and staff management web application for an auto garage. This repo contains a React + Vite frontend (TypeScript + Tailwind) and a small PHP-based API for server-side operations and database access.

Key features
- Booking creation and management
- Staff listing and admin pages
- Responsive UI built with Tailwind CSS
- Lightweight PHP endpoints for authentication and data persistence

Tech stack
- Frontend: Vite, React, TypeScript, Tailwind CSS
- Backend: PHP (plain PHP files in `php-api/`)
- Database: MySQL or PostgreSQL (setup scripts included in `docs/`)
- Tests: Vitest (unit tests for utilities and schemas)

Repository layout
- `src/` — React app source (components, pages, hooks, lib)
- `php-api/` — PHP endpoints and DB config
- `docs/` — setup notes and SQL files
- `public/` — static assets
- `tests/` — Vitest unit tests

Quick start

Prerequisites
- Node.js (>=18)
- npm or yarn
- PHP (for running the `php-api/` endpoints) and a compatible database (MySQL or PostgreSQL)

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

Running the backend PHP API (development)

1. Configure database settings in `php-api/config.php`.
2. From the project root, run the built-in PHP server pointing at the `php-api/` folder:

```bash
php -S 0.0.0.0:8000 -t php-api
```

The PHP endpoints will then be available under `http://localhost:8000/` (for example `http://localhost:8000/get_bookings.php`).

Database
- See `docs/POSTGRESQL_SETUP.md` for PostgreSQL instructions and `php-api/create_db.sql` for a generic SQL setup.
- Update `php-api/config.php` with your DB credentials before running the API.

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

Contributing
- Open an issue or create a pull request. Keep changes focused and add tests for new logic when possible.

License
- See `package.json` for license information.

If you'd like, I can run the test suite or create a small CONTRIBUTING.md next.
