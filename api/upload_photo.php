<?php
header('Content-Type: application/json');
session_start();
require 'config.php';

if (!isset($_SESSION['id'])) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

$userId = $_SESSION['id'];
$file = $_FILES['photo'];
$allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if (!in_array($ext, $allowed)) {
    echo json_encode(['success' => false, 'error' => 'Invalid file type']);
    exit;
}

if ($file['size'] > 5 * 1024 * 1024) { // 5MB max
    echo json_encode(['success' => false, 'error' => 'File too large (max 5MB)']);
    exit;
}

// Create uploads folder if not exists
$uploadDir = '../uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$filename = 'user_' . $userId . '_' . time() . '.' . $ext;
$filepath = $uploadDir . $filename;

if (move_uploaded_file($file['tmp_name'], $filepath)) {
    $photo_url = 'http://localhost/welancer/uploads/' . $filename;

    // Save to database
    $stmt = $pdo->prepare("UPDATE users SET photo = ? WHERE id = ?");
    $stmt->execute([$photo_url, $userId]);

    echo json_encode([
        'success' => true,
        'photo_url' => $photo_url . '?t=' . time()
    ]);
} else {
    echo json_encode(['success' => false, 'error' => 'Upload failed']);
}
?>