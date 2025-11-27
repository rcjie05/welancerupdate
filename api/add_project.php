<?php
// api/add_project.php — FINAL CLEAN VERSION (NO WARNINGS, NO NOTICES)
session_start();
require 'config.php';

// Prevent any output before JSON
ob_start();

header('Content-Type: application/json');

if (!isset($_SESSION['id'])) {
    echo json_encode(['success' => false, 'error' => 'Login required']);
    exit;
}

$userId = (int)$_SESSION['id'];
$role   = $_SESSION['role'] ?? 'member';

if (!in_array($role, ['admin', 'hr', 'manager'])) {
    echo json_encode(['success' => false, 'error' => 'Access denied']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'error' => 'No data received']);
    exit;
}

$name           = trim($data['name'] ?? '');
$total_points   = (int)($data['points'] ?? 100);
$task_quantity  = (int)($data['task_quantity'] ?? 5);
$points_per_task = (int)($data['points_per_task'] ?? 0);
$manager_id     = $data['manager_id'] ?? null;

if ($name === '' || $task_quantity < 1 || $total_points < 10) {
    echo json_encode(['success' => false, 'error' => 'Invalid project data']);
    exit;
}

// Auto-assign manager if not set
if (!$manager_id || $manager_id === 'null' || $manager_id === '') {
    $manager_id = $userId;
}

$points_per_task = $points_per_task > 0 ? $points_per_task : floor($total_points / $task_quantity);

try {
    $stmt = $pdo->prepare("
        INSERT INTO projects 
        (name, manager_id, points, task_quantity, points_per_task, status) 
        VALUES (?, ?, ?, ?, ?, 'In Progress')
    ");
    $stmt->execute([$name, $manager_id, $total_points, $task_quantity, $points_per_task]);

    // Clean any output buffer
    ob_end_clean();

    echo json_encode(['success' => true, 'message' => 'Project created!']);
    exit;

} catch (Exception $e) {
    ob_end_clean();
    error_log("Add project error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database error']);
    exit;
}