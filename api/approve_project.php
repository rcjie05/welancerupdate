<?php
// api/approve_project.php — FINAL 100% WORKING (accepts both JSON & form POST)
session_start();
require 'config.php';
header('Content-Type: application/json');

// Only HR or Admin
if (!isset($_SESSION['id']) || !in_array($_SESSION['role'], ['hr', 'admin'])) {
    echo json_encode(['success' => false, 'error' => 'HR/Admin only']);
    exit;
}

$userId = (int)$_SESSION['id'];

// Accept data from JSON body OR normal POST
$input = json_decode(file_get_contents('php://input'), true);
if (!$input && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = $_POST;
}

$project_id = (int)($input['project_id'] ?? 0);

if ($project_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid project ID']);
    exit;
}

// Check if project exists and is pending HR approval
$stmt = $pdo->prepare("SELECT * FROM projects WHERE id = ? AND project_status = 'Pending HR Approval'");
$stmt->execute([$project_id]);
$project = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$project) {
    echo json_encode(['success' => false, 'error' => 'Project not found or not ready for HR approval']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Mark project as Completed
    $pdo->prepare("UPDATE projects SET project_status = 'Completed' WHERE id = ?")
        ->execute([$project_id]);

    // BIG BONUS
    $managerBonus = 100;
    $memberBonus  = 50;

    // Bonus to manager
    if ($project['manager_id']) {
        $pdo->prepare("UPDATE users SET score = score + ? WHERE id = ?")
            ->execute([$managerBonus, $project['manager_id']]);
    }

    // Bonus to all members who completed tasks in this project
    $stmt = $pdo->prepare("
        SELECT DISTINCT user_id 
        FROM tasks 
        WHERE project_id = ? AND status = 'Completed'
    ");
    $stmt->execute([$project_id]);
    $members = $stmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($members as $memberId) {
        $pdo->prepare("UPDATE users SET score = score + ? WHERE id = ?")
            ->execute([$memberBonus, $memberId]);
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message'   => 'Project approved! Bonuses awarded!',
        'manager_bonus' => $managerBonus,
        'member_bonus'  => $memberBonus,
        'members_count' => count($members)
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    error_log("HR approve project error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Server error']);
}
?>