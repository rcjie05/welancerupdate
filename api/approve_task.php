<?php
// api/approve_task.php — FIXED: Managers can now approve/reject!
session_start();
require 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['id'])) {
    echo json_encode(['success' => false, 'error' => 'Login required']);
    exit;
}

$userId = (int)$_SESSION['id'];  // ← CORRECT: use 'id', not 'user_id'

$data = json_decode(file_get_contents('php://input'), true);
$task_id = $data['task_id'] ?? 0;
$approve = !empty($data['approve']);

if (!$task_id) {
    echo json_encode(['success' => false, 'error' => 'Invalid task']);
    exit;
}

// Get task + project manager
$stmt = $pdo->prepare("
    SELECT t.*, p.manager_id 
    FROM tasks t 
    JOIN projects p ON t.project_id = p.id 
    WHERE t.id = ?
");
$stmt->execute([$task_id]);
$task = $stmt->fetch();

if (!$task) {
    echo json_encode(['success' => false, 'error' => 'Task not found']);
    exit;
}

// FIXED: Compare with correct session key!
if ((int)$task['manager_id'] !== $userId) {
    echo json_encode(['success' => false, 'error' => 'Not authorized']);
    exit;
}

$newStatus = $approve ? 'Completed' : 'Rejected';
$points = $approve ? (int)$task['points'] : 0;

try {
    $pdo->beginTransaction();

    // Update task status
    $pdo->prepare("UPDATE tasks SET status = ? WHERE id = ?")
        ->execute([$newStatus, $task_id]);

    if ($approve && $points > 0) {
        // Award points to member
        $pdo->prepare("UPDATE users SET score = score + ?, completed_tasks = completed_tasks + 1 WHERE id = ?")
            ->execute([$points, $task['user_id']]);

        // Give manager bonus (75% of task points)
        $manager_bonus = (int)round($points * 0.75);
        $pdo->prepare("UPDATE users SET score = score + ? WHERE id = ?")
            ->execute([$manager_bonus, $userId]);
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'status' => $newStatus,
        'points_awarded' => $points,
        'manager_bonus' => $approve ? (int)round($points * 0.75) : 0
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    error_log("Approve task error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Server error']);
}
?>