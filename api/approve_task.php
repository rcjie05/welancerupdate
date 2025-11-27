<?php
// api/approve_task.php — FINAL HR PROJECT APPROVAL SYSTEM
session_start();
require 'config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['id'])) {
    echo json_encode(['success' => false, 'error' => 'Login required']);
    exit;
}

$userId = (int)$_SESSION['id'];
$role = $_SESSION['role'] ?? 'member';

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$task_id = $input['task_id'] ?? 0;
$approve = !empty($input['approve']);

if (!$task_id) {
    echo json_encode(['success' => false, 'error' => 'Invalid task']);
    exit;
}

// Get task + project
$stmt = $pdo->prepare("
    SELECT t.*, p.manager_id, p.points_per_task, p.project_status 
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

$projectManagerId = $task['manager_id'] ? (int)$task['manager_id'] : null;
$isManager = ($projectManagerId === $userId);
$isAdminHr = in_array($role, ['admin', 'hr']);

if (!$isManager && !$isAdminHr) {
    echo json_encode(['success' => false, 'error' => 'Not authorized']);
    exit;
}

$newStatus = $approve ? 'Completed' : 'Rejected';
$pointsToAward = $approve ? (int)$task['points'] : 0;

try {
    $pdo->beginTransaction();

    // Update task
    $stmt = $pdo->prepare("UPDATE tasks SET status = ?, approved_at = NOW() WHERE id = ?");
    $stmt->execute([$newStatus, $task_id]);

    if ($approve && $pointsToAward > 0) {
        // Award member
        $pdo->prepare("UPDATE users SET score = score + ?, completed_tasks = completed_tasks + 1 WHERE id = ?")
            ->execute([$pointsToAward, $task['user_id']]);

        // Manager bonus
        $bonus = (int)round($pointsToAward * 0.75);
        $pdo->prepare("UPDATE users SET score = score + ? WHERE id = ?")
            ->execute([$bonus, $userId]);
    }

    // CHECK IF ALL TASKS ARE COMPLETED → TRIGGER HR APPROVAL
    $total = $pdo->prepare("SELECT COUNT(*) FROM tasks WHERE project_id = ?")->execute([$task['project_id']]);
    $total = $pdo->query("SELECT COUNT(*) FROM tasks WHERE project_id = " . (int)$task['project_id'])->fetchColumn();

    $completed = $pdo->query("SELECT COUNT(*) FROM tasks WHERE project_id = " . (int)$task['project_id'] . " AND status = 'Completed'")->fetchColumn();

    if ($total == $completed && $total > 0) {
        // Use the latest proof as project proof
        $latestProof = $pdo->query("
        SELECT proof_photo FROM tasks 
        WHERE project_id = " . (int)$task['project_id'] . " 
        AND proof_photo IS NOT NULL AND status = 'Completed'
        ORDER BY approved_at DESC LIMIT 1
        ")->fetchColumn() ?: null;

        $pdo->prepare("
            UPDATE projects 
            SET project_status = 'Pending HR Approval',
                final_proof_photo = ?
            WHERE id = ?
        ")->execute([$latestProof, $task['project_id']]);
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'status' => $newStatus,
        'points_awarded' => $pointsToAward,
        'project_ready_for_hr' => ($total == $completed && $total > 0)
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    error_log("Approve error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Server error']);
}
?>