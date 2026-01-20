<?php
require_once __DIR__ . '/db.php';

try {
    $stmt = $pdo->query("SELECT * FROM staff ORDER BY created_at DESC");
    $staff = $stmt->fetchAll();
    echo json_encode(['success' => true, 'data' => $staff]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to fetch staff']);
}
