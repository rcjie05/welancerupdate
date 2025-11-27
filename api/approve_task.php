<?php
// api/approve_task.php — FINAL 100% WORKING VERSION
session_start();
require 'config.php';
header('Content-Type: application/json');

// Must be logged in
if (!isset($_SESSION['id'])) {
    echo json_encode(['success' => false, 'error' => 'Login required']);
    exit;
}

$userId = (int)$_SESSION['id'];
$role = $_SESSION['role'] ?? 'member';

// Accept both JSON body and GET/POST (fallback)
$input = json_decode(file_get_contents('php://input'), true);
if (!$input && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = $_POST;
}
if (!$input && isset($_GET['task_id'])) {
    $input = $_GET;
}

$task_id = $input['task_id'] ?? 0;
$approve = !empty($input['approve']) || $input['approve'] === 'true' || $input['approve'] === true;

if (!$task_id) {
    echo json_encode(['success' => false, 'error' => 'Invalid task ID']);
    exit;
}

// Get task + project manager
$stmt = $pdo->prepare("
    SELECT t.*, p.manager_id, p.points_per_task 
    FROM tasks t 
    JOIN projects p ON t.project_id = p.id 
    WHERE t.id = ?
");
$stmt->execute([$task_id]);
$task = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$task) {
    echo json_encode(['success' => false, 'error' => 'Task not found']);
    exit;
}

// AUTHORIZATION: Manager of the project OR Admin/HR
$projectManagerId = $task['manager_id'] ? (int)$task['manager_id'] : null;
$isManager = ($projectManagerId === $userId);
$isAdminHr = in_array($role, ['admin', 'hr']);

if (!$isManager && !$isAdminHr) {
    echo json_encode(['success' => false, 'error' => 'Not authorized. You are not the manager of this project.']);
    exit;
}

$newStatus = $approve ? 'Completed' : 'Rejected';
$pointsToAward = $approve ? (int)$task['points'] : 0;

try {
    $pdo->beginTransaction();

    // Update task status + approved_at
    $stmt = $pdo->prepare("UPDATE tasks SET status = ?, approved_at = NOW() WHERE id = ?");
    $stmt->execute([$newStatus, $task_id]);

    if ($approve && $pointsToAward > 0) {
        // Award member
        $pdo->prepare("UPDATE users SET score = score + ?, completed_tasks = completed_tasks + 1 WHERE id = ?")
            ->execute([$pointsToAward, $task['user_id']]);

        // Give manager 75% bonus
        $bonus = (int)round($pointsToAward * 0.75);
        $pdo->prepare("UPDATE users SET score = score + ? WHERE id = ?")
            ->execute([$bonus, $userId]);
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'status' => $newStatus,
        'points_awarded' => $pointsToAward,
        'manager_bonus' => $approve ? (int)round($pointsToAward * 0.75) : 0
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    error_log("Approve error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
?>