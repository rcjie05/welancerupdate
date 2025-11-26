<?php
// api/projects.php — 100% FIXED: Everyone sees what they should!
session_start();
require 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Login required']);
    exit;
}
$userId = (int)$_SESSION['id'];
$role   = $_SESSION['role'] ?? 'member';

try {
    if ($role === 'admin' || $role === 'hr') {
        // Admin & HR see ALL projects
        $stmt = $pdo->query("
            SELECT p.*, u.name AS manager_name 
            FROM projects p 
            LEFT JOIN users u ON p.manager_id = u.id 
            ORDER BY p.id DESC
        ");
    } 
    elseif ($role === 'manager') {
        // Manager sees ONLY his own projects
        $stmt = $pdo->prepare("
            SELECT p.*, u.name AS manager_name 
            FROM projects p 
            LEFT JOIN users u ON p.manager_id = u.id 
            WHERE p.manager_id = ? 
            ORDER BY p.id DESC
        ");
        $stmt->execute([$userId]);
    } 
    else {
        // Members see projects they have tasks in
        $stmt = $pdo->prepare("
            SELECT DISTINCT p.*, u.name AS manager_name
            FROM projects p
            LEFT JOIN users u ON p.manager_id = u.id
            LEFT JOIN tasks t ON t.project_id = p.id 
            WHERE t.user_id = ?
            ORDER BY p.id DESC
        ");
        $stmt->execute([$userId]);
    }

    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Force IDs to int (prevents JS bugs)
    foreach ($projects as &$p) {
        $p['id'] = (int)$p['id'];
        $p['manager_id'] = $p['manager_id'] ? (int)$p['manager_id'] : null;
        $p['points'] = (int)$p['points'];
        $p['task_quantity'] = (int)$p['task_quantity'];
        $p['points_per_task'] = (int)$p['points_per_task'];
    }

    echo json_encode($projects);

} catch (Exception $e) {
    error_log("Projects API Error: " . $e->getMessage());
    echo json_encode([]);
}
?>