<?php
// api/add_task.php — FINAL VERSION: Uses fixed points + no auto-complete
session_start();
require 'config.php';

if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Login required']);
    exit;
}
$userId = (int)$_SESSION['id'];
$role   = $_SESSION['role'] ?? 'member';

$data = json_decode(file_get_contents('php://input'), true);
$title      = $data['title'] ?? '';
$project_id = $data['project_id'] ?? 0;
$user_id    = $data['user_id'] ?? 0;

if (!$title || !$project_id || !$user_id) {
    echo json_encode(['success' => false, 'error' => 'Missing data']);
    exit;
}

// GET FIXED POINTS FROM PROJECT
$stmt = $pdo->prepare("SELECT points_per_task, task_quantity FROM projects WHERE id = ?");
$stmt->execute([$project_id]);
$project = $stmt->fetch();

if (!$project) {
    echo json_encode(['success' => false, 'error' => 'Project not found']);
    exit;
}

$points = (int)$project['points_per_task'];

// Prevent over-creation
$stmt = $pdo->prepare("SELECT COUNT(*) FROM tasks WHERE project_id = ?");
$stmt->execute([$project_id]);
if ($stmt->fetchColumn() >= $project['task_quantity']) {
    echo json_encode(['success' => false, 'error' => 'All tasks already assigned']);
    exit;
}

// INSERT TASK — status = Pending, points = fixed
$stmt = $pdo->prepare("
    INSERT INTO tasks (title, project_id, user_id, status, points, proof_photo) 
    VALUES (?, ?, ?, 'Pending', ?, NULL)
");
$stmt->execute([$title, $project_id, $user_id, $points]);

echo json_encode([
    'success' => true,
    'message' => 'Task assigned!',
    'points' => $points
]);
?>