<?php
header('Content-Type: application/json');
session_start();
require 'config.php';

if (!in_array($_SESSION['role'] ?? '', ['admin','hr','manager'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$team_name = trim($input['team_name'] ?? '');
$project_id = $input['project_id'] ?? 0;
$member_ids = $input['members'] ?? [];

if (empty($team_name) || !$project_id) {
    echo json_encode(['success' => false, 'error' => 'Invalid data']);
    exit;
}

try {
    $pdo->beginTransaction();
    
    $stmt = $pdo->prepare("INSERT INTO teams (name, project_id) VALUES (?, ?)");
    $stmt->execute([$team_name, $project_id]);
    $team_id = $pdo->lastInsertId();

    if (!empty($member_ids)) {
        $stmt = $pdo->prepare("INSERT INTO team_members (team_id, user_id) VALUES (?, ?)");
        foreach ($member_ids as $user_id) {
            $stmt->execute([$team_id, $user_id]);
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'team_id' => $team_id]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'error' => 'Failed to create team']);
}
?>