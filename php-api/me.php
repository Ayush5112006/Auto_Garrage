<?php
require_once __DIR__ . '/db.php';

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$stmt = $pdo->prepare('SELECT id, name, email FROM users WHERE id = ?');
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'User not found']);
    exit;
}

echo json_encode($user);
