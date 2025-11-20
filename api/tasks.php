<?php
header('Content-Type: application/json');
session_start();
require 'config.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Login required']);
    exit;
}

$userId = $_SESSION['user_id'];
$role   = $_SESSION['role'] ?? 'member';

try {
    if ($role === 'admin' || $role === 'hr' || $role === 'manager') {
        // Managers see tasks from their projects
        if ($role === 'manager') {
            $stmt = $pdo->prepare("
                SELECT t.*, p.name AS project_name, u.name AS user_name
                FROM tasks t
                JOIN projects p ON t.project_id = p.id
                LEFT JOIN users u ON t.user_id = u.id
                WHERE p.manager_id = ?
                ORDER BY t.id DESC
            ");
            $stmt->execute([$userId]);
        } else {
            // Admin/HR see all
            $stmt = $pdo->query("
                SELECT t.*, p.name AS project_name, u.name AS user_name
                FROM tasks t
                JOIN projects p ON t.project_id = p.id
                LEFT JOIN users u ON t.user_id = u.id
                ORDER BY t.id DESC
            ");
        }
    } else {
        // Members see only their tasks
        $stmt = $pdo->prepare("
            SELECT t.*, p.name AS project_name
            FROM tasks t
            JOIN projects p ON t.project_id = p.id
            WHERE t.user_id = ?
            ORDER BY t.id DESC
        ");
        $stmt->execute([$userId]);
    }

    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
?>