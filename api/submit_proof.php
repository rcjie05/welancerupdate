<?php
// api/submit_proof.php — FIXED: Members can now upload proof!
session_start();
require 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['id'])) {
    echo json_encode(['success' => false, 'error' => 'Login required']);
    exit;
}

$userId = (int)$_SESSION['id'];  // ← CORRECT: use 'id', not 'user_id'

if (!isset($_FILES['proof']) || $_FILES['proof']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'error' => 'No file uploaded']);
    exit;
}

$task_id = $_POST['task_id'] ?? 0;
if (!$task_id) {
    echo json_encode(['success' => false, 'error' => 'Invalid task']);
    exit;
}

// Check if task belongs to current user
$stmt = $pdo->prepare("SELECT user_id FROM tasks WHERE id = ?");
$stmt->execute([$task_id]);
$task = $stmt->fetch();

if (!$task || (int)$task['user_id'] !== $userId) {  // ← FIXED: compare with $userId
    echo json_encode(['success' => false, 'error' => 'Not your task']);
    exit;
}

// Upload file
$uploadDir = '../proofs/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

$file = $_FILES['proof'];
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = 'proof_' . $task_id . '_' . time() . '.' . strtolower($ext);
$path = $uploadDir . $filename;

if (move_uploaded_file($file['tmp_name'], $path)) {
    $url = 'proofs/' . $filename;

    $stmt = $pdo->prepare("UPDATE tasks SET proof_photo = ?, status = 'Pending Approval' WHERE id = ?");
    $stmt->execute([$url, $task_id]);

    echo json_encode(['success' => true, 'message' => 'Proof uploaded!', 'photo_url' => $url]);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to save file']);
}
?>