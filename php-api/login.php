<?php
require_once __DIR__ . '/db.php';

$input = json_decode(file_get_contents('php://input'), true);
$email = filter_var($input['email'] ?? '', FILTER_VALIDATE_EMAIL);
$password = $input['password'] ?? '';

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

$stmt = $pdo->prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid credentials']);
    exit;
}

// set session
$_SESSION['user_id'] = (int)$user['id'];

echo json_encode(['id' => $user['id'], 'name' => $user['name'], 'email' => $user['email']]);
