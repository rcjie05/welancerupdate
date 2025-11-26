<?php
require 'config.php';  // Handles CORS + session + $pdo

if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

$userId = $_SESSION['id'];

if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['photo'];
$allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if (!in_array($ext, $allowed)) {
    echo json_encode(['success' => false, 'error' => 'Invalid file type']);
    exit;
}

if ($file['size'] > 5 * 1024 * 1024) {
    echo json_encode(['success' => false, 'error' => 'File too large (max 5MB)']);
    exit;
}

// Create uploads folder
$uploadDir = '../uploads/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

// Unique safe filename
$filename = 'profile_' . $userId . '_' . time() . '_' . bin2hex(random_bytes(5)) . '.' . $ext;
$filepath = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $filepath)) {
    echo json_encode(['success' => false, 'error' => 'Failed to save file']);
    exit;
}

// Generate correct absolute URL (works on localhost AND 127.0.0.1:5500)
$photo_url = 'http://localhost/welancer/uploads/' . $filename;

// Save to database
try {
    $stmt = $pdo->prepare("UPDATE users SET photo = ? WHERE id = ?");
    $stmt->execute([$photo_url, $userId]);
} catch (Exception $e) {
    @unlink($filepath);
    echo json_encode(['success' => false, 'error' => 'DB Error: ' . $e->getMessage()]);
    exit;
}

echo json_encode([
    'success' => true,
    'photo_url' => $photo_url . '?v=' . time(),
    'message' => 'Photo updated!'
]);