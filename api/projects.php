<?php
header('Content-Type: application/json');
session_start();
require 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode([]);
    exit;
}

$userId = (int)$_SESSION['user_id'];
$role   = $_SESSION['role'] ?? 'member';

try {
    if ($role === 'admin' || $role === 'hr') {
        $stmt = $pdo->query("
            SELECT p.*, u.name AS manager_name 
            FROM projects p 
            LEFT JOIN users u ON p.manager_id = u.id 
            ORDER BY p.id DESC
        ");
    } elseif ($role === 'manager') {
        // THIS IS THE CRITICAL FIX
        $stmt = $pdo->prepare("
            SELECT p.*, u.name AS manager_name 
            FROM projects p 
            LEFT JOIN users u ON p.manager_id = u.id 
            WHERE p.manager_id = ? 
            ORDER BY p.id DESC
        ");
        $stmt->execute([$userId]);
    } else {
        // Members see projects they have tasks in
        $stmt = $pdo->prepare("
            SELECT DISTINCT p.*, u.name AS manager_name
            FROM projects p
            LEFT JOIN users u ON p.manager_id = u.id
            LEFT JOIN tasks t ON t.project_id = p.id AND t.user_id = ?
            WHERE t.user_id IS NOT NULL
            ORDER BY p.id DESC
        ");
        $stmt->execute([$userId]);
    }

    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($projects);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([]);
}
?>