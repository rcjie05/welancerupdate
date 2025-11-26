<?php
// api/tasks.php — 100% FIXED: MEMBERS NOW SEE THEIR TASKS!
session_start();
require 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['id'])) {
    echo json_encode([]);
    exit;
}

$userId = (int)$_SESSION['id'];
$role   = $_SESSION['role'] ?? 'member';

try {
    if (in_array($role, ['admin', 'hr', 'manager'])) {
        // Admin, HR, Manager → see ALL tasks
        $stmt = $pdo->query("
            SELECT t.*, p.name AS project_name, u.name AS member_name
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.id
            LEFT JOIN users u ON t.user_id = u.id
            ORDER BY t.id DESC
        ");
    } else {
        // Member → sees ONLY their own tasks
        $stmt = $pdo->prepare("
            SELECT t.*, p.name AS project_name, u.name AS member_name
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.id
            LEFT JOIN users u ON t.user_id = u.id
            WHERE t.user_id = ?
            ORDER BY t.id DESC
        ");
        $stmt->execute([$userId]);
    }

    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // CRITICAL: Force all IDs to integer (fixes JS comparison bug)
    foreach ($tasks as &$task) {
        $task['id']         = (int)$task['id'];
        $task['project_id'] = (int)$task['project_id'];
        $task['user_id']    = $task['user_id'] ? (int)$task['user_id'] : null;
        $task['points']     = (int)($task['points'] ?? 0);
        $task['status']     = $task['status'] ?? 'Pending';
        $task['proof_photo']= $task['proof_photo'] ?? null;
    }

    echo json_encode($tasks);

} catch (Exception $e) {
    error_log("Tasks API Error: " . $e->getMessage());
    echo json_encode([]);
}
?>