# PostgreSQL Database Setup Guide

## Prerequisites
- PostgreSQL installed and running
- PHP with PostgreSQL extension (php_pdo_pgsql.dll enabled in php.ini)
- Web server (Apache/XAMPP/built-in PHP server)

## Setup Steps

### 1. Start PostgreSQL
On Windows:
```bash
# If using PostgreSQL service, it should be running automatically
# Or start psql command line
psql -U postgres
```

### 2. Create Database
Open PowerShell/Command Prompt and run:
```bash
psql -U postgres -f create_db_postgresql.sql
```

Or manually in pgAdmin:
1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Click "Servers" → "PostgreSQL" (or your server name)
4. Right-click → "Query Tool"
5. Copy-paste the contents of `create_db_postgresql.sql`
6. Click Execute

### 3. Verify Connection
Update your connection in `config.php` (should already be done):
```php
$DB_HOST = 'localhost';
$DB_PORT = 5432;
$DB_NAME = 'auto_auth';
$DB_USER = 'auto_user';
$DB_PASS = 'autoshop_dev_password';
```

### 4. Copy PHP API to Web Server
Place the `php-api` folder in your web server root:
- XAMPP: `C:\xampp\htdocs\php-api`
- IIS: `C:\inetpub\wwwroot\php-api`
- Or any other web server path

### 5. Verify API Endpoints
The following endpoints are now available:
- `http://localhost/php-api/get_bookings.php` - Fetch all bookings
- `http://localhost/php-api/update_booking.php` - Update booking status
- `http://localhost/php-api/get_staff.php` - Fetch all staff
- `http://localhost/php-api/update_staff.php` - Update staff status

### 6. Test Connection
Visit in your browser:
```
http://localhost/php-api/get_bookings.php
```

Should return JSON with your bookings data.

## Troubleshooting

**Connection refused error:**
- Ensure PostgreSQL is running
- Check hostname/port in config.php
- Verify credentials are correct

**"FATAL: Ident authentication failed":**
- Update `pg_hba.conf` to use md5 authentication
- Default location: `C:\Program Files\PostgreSQL\version\data\pg_hba.conf`
- Change `ident` to `md5` or `password`

**PHP PDO PostgreSQL not loading:**
- Edit `php.ini`
- Uncomment: `;extension=pdo_pgsql`
- Remove the semicolon: `extension=pdo_pgsql`
- Restart web server
