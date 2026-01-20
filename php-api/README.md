PHP auth API (session-based)

Setup (XAMPP):
1. Copy the `php-api/` folder to your XAMPP htdocs directory (e.g., `C:\xampp\htdocs\php-api`).
2. Open phpMyAdmin or MySQL client and run `create_db.sql` to create database and user.
3. Edit `config.php` to match DB credentials and set `$ALLOWED_ORIGIN` to your frontend origin (default `http://localhost:5173`).
4. Start Apache & MySQL via XAMPP. API endpoints will be available at `http://localhost/php-api/*.php`.

Endpoints:
- POST `/register.php`  { name, email, password } → registers and starts session
- POST `/login.php`     { email, password } → logs in, returns user
- POST `/logout.php`    → ends session
- GET  `/me.php`        → returns current user if session exists

Important:
- For development, Vite runs on `http://localhost:5173`. `Access-Control-Allow-Origin` is set in `config.php`.
- Session cookies require `credentials: 'include'` on fetch requests from the frontend.
