<?php
// delete_user.php
header('Content-Type: application/json');
session_start();
require 'config.php';

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['error' => '>Unauthorized']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$user_id = $input['user_id'] ?? 0;

if (!$user_id || $user_id == $_SESSION['id']) {
    echo json_encode(['error' => 'Cannot delete this user']);
    exit;
}

try {
    $pdo->prepare("DELETE FROM tasks WHERE user_id = ?")->execute([$user_id]);
    $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$user_id]);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['error' => 'Delete failed']);
}
?>