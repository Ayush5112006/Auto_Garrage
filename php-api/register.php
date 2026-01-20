<?php
require_once __DIR__ . '/db.php';

$input = json_decode(file_get_contents('php://input'), true);
$name = trim($input['name'] ?? '');
$email = filter_var($input['email'] ?? '', FILTER_VALIDATE_EMAIL);
$password = $input['password'] ?? '';

if (!$email || strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

try {
    // check existing user
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Email already registered']);
        exit;
    }

    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
    $stmt->execute([$name, $email, $password_hash]);
    $uid = $pdo->lastInsertId();

    // store session
    $_SESSION['user_id'] = (int)$uid;

    echo json_encode(['id' => $uid, 'name' => $name, 'email' => $email]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit;
}
