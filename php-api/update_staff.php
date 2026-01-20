<?php
require_once __DIR__ . '/db.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['id']) || !isset($input['status'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing id or status']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE staff SET status = ? WHERE id = ?");
    $stmt->execute([$input['status'], $input['id']]);
    
    echo json_encode(['success' => true, 'message' => 'Staff updated']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to update staff']);
}
