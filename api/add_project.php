<?php
header('Content-Type: application/json');
session_start();
require 'config.php';

if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin', 'hr'])) {
    echo json_encode(['success' => false, 'error' => 'Only Admin/HR can create projects']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$name = trim($input['name'] ?? '');
$status = $input['status'] ?? 'Pending';
$manager_id = $input['manager_id'] ?? null;

if (empty($name)) {
    echo json_encode(['success' => false, 'error' => 'Project name required']);
    exit;
}

if (!$manager_id || !is_numeric($manager_id)) {
    echo json_encode(['success' => false, 'error' => 'Please select a valid manager']);
    exit;
}

$manager_id = (int)$manager_id;

try {
    $stmt = $pdo->prepare("INSERT INTO projects (name, status, manager_id) VALUES (?, ?, ?)");
    $stmt->execute([$name, $status, $manager_id]);
    
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Failed to create project']);
}
?>