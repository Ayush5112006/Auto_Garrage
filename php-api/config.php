<?php
// config.php - basic config for PHP auth API
// Copy this folder to XAMPP htdocs (e.g., C:\xampp\htdocs\php-api)
// Update DB credentials below after running create_db.sql

$DB_HOST = 'localhost';
$DB_PORT = 5432;
$DB_NAME = 'auto_auth';
$DB_USER = 'auto_user';
$DB_PASS = 'autoshop_dev_password';

// Vite dev server origin used during development
$ALLOWED_ORIGIN = 'http://localhost:5173';

// Start session and set CORS headers
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: $ALLOWED_ORIGIN");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    http_response_code(200);
    exit;
}

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: $ALLOWED_ORIGIN");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
