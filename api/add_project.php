<?php
// api/add_project.php — ONLY creates project (tasks created later by manager)
session_start();
require 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false]); 
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$name           = trim($data['name'] ?? '');
$manager_id     = $data['manager_id'] ?? $_SESSION['user_id'];
$total_points   = (int)($data['points'] ?? 100);
$task_quantity  = (int)($data['task_quantity'] ?? 5);
$points_per_task = (int)($data['points_per_task'] ?? floor($total_points / $task_quantity));

if (!$name || $task_quantity < 1 || $points_per_task < 1) {
    echo json_encode(['success' => false, 'error' => 'Invalid data']);
    exit;
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        INSERT INTO projects 
        (name, manager_id, points, task_quantity, points_per_task, status) 
        VALUES (?, ?, ?, ?, ?, 'In Progress')
    ");
    $stmt->execute([$name, $manager_id, $total_points, $task_quantity, $points_per_task]);
    $project_id = $pdo->lastInsertId();

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'project_id' => $project_id,
        'message' => "Project created! Now create and assign $task_quantity tasks."
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>