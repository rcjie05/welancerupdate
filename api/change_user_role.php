<?php
// change_user_role.php
header('Content-Type: application/json');
session_start();
require 'config.php';

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$user_id = $input['user_id'] ?? 0;
$new_role = $input['role'] ?? '';

if (!$user_id || !in_array($new_role, ['member','manager','hr','admin'])) {
    echo json_encode(['error' => 'Invalid data']);
    exit;
}

if ($_SESSION['id'] == $user_id) {
    echo json_encode(['error' => 'Cannot change own role']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE users SET role = ? WHERE id = ?");
    $stmt->execute([$new_role, $user_id]);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['error' => 'Database error']);
}
?>