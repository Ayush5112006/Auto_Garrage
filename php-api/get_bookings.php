<?php
require_once __DIR__ . '/db.php';

try {
    $stmt = $pdo->query("SELECT * FROM bookings ORDER BY created_at DESC");
    $bookings = $stmt->fetchAll();
    echo json_encode(['success' => true, 'data' => $bookings]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to fetch bookings']);
}
