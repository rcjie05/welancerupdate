<?php
header('Content-Type: application/json');
session_start();
require 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['members' => []]);
    exit;
}

$project_id = (int)($_GET['project_id'] ?? 0);
if ($project_id <= 0) {
    echo json_encode(['members' => []]);
    exit;
}

try {
    // Check if project belongs to current manager
    if ($_SESSION['role'] === 'manager') {
        $stmt = $pdo->prepare("SELECT id, name FROM projects WHERE id = ? AND manager_id = ?");
        $stmt->execute([$project_id, $_SESSION['user_id']]);
        $project = $stmt->fetch();
        if (!$project) {
            echo json_encode(['members' => []]);
            exit;
        }
    }

    // Get all members (you can later improve with project_members table)
    $stmt = $pdo->prepare("SELECT id, name FROM users WHERE role = 'member' ORDER BY name");
    $stmt->execute();
    $members = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'team' => ['name' => 'All Members'], 
        'members' => $members
    ]);

} catch (Exception $e) {
    echo json_encode(['members' => []]);
}
?>