# PHP + MySQL Auth (XAMPP) — Setup Guide

This project includes a minimal PHP session-based auth API intended for local development with XAMPP.

1. Copy the `php-api/` folder into your XAMPP `htdocs` directory (e.g., `C:\xampp\htdocs\php-api`).
2. Open phpMyAdmin or MySQL client and run `php-api/create_db.sql` to create the `auto_auth` DB and `auto_user` user (default password `change_me`).
3. Update `php-api/config.php` to match DB credentials and set `$ALLOWED_ORIGIN` to your frontend origin (default `http://localhost:5173`).
4. Start Apache and MySQL via XAMPP.
5. Run frontend: `npm run dev` and ensure `VITE_PHP_API_ORIGIN` and `VITE_PHP_API_PREFIX` in `.env` match the PHP location.

API endpoints (examples):
- POST `http://localhost/php-api/register.php`   body `{ name, email, password }`
- POST `http://localhost/php-api/login.php`      body `{ email, password }`
- POST `http://localhost/php-api/logout.php`
- GET  `http://localhost/php-api/me.php`

Notes:
- Frontend uses `fetch(..., { credentials: 'include' })` to include the session cookie.
- For production, secure session cookies and HTTPS are required.
