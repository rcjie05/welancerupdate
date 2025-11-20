<?php
header('Content-Type: application/json');
session_start();
require 'config.php';  // ← MUST BE AFTER session_start() AND BEFORE ANY CHECK

// Only admin, hr, manager can create tasks
if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role'], ['admin', 'hr', 'manager'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$title      = trim($input['title'] ?? '');
$project_id = (int)($input['project_id'] ?? 0);
$user_id    = (int)($input['user_id'] ?? 0);
$status     = $input['status'] ?? 'Pending';

if (empty($title) || $project_id <= 0 || $user_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid data']);
    exit;
}

// Optional: Manager can only assign tasks in their own projects
if ($_SESSION['role'] === 'manager') {
    $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = ? AND manager_id = ?");
    $stmt->execute([$project_id, $_SESSION['user_id']]);
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Not your project']);
        exit;
    }
}

try {
    $stmt = $pdo->prepare("INSERT INTO tasks (title, project_id, user_id, status) VALUES (?, ?, ?, ?)");
    $stmt->execute([$title, $project_id, $user_id, $status]);
    
    echo json_encode(['success' => true, 'message' => 'Task created', 'id' => $pdo->lastInsertId()]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'DB Error: ' . $e->getMessage()]);
}
?>