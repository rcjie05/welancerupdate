<?php
session_start();
require 'config.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['username']) || empty($input['password'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing credentials"]);
    exit;
}

$username = trim($input['username']);
$password = $input['password'];

try {
    $stmt = $pdo->prepare("SELECT id, name, username, password, role, photo, score, completed_tasks FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password'])) {
        // FIX: Use 'user_id' — SAME AS ALL OTHER FILES
        $_SESSION['user_id'] = $user['id'];     // ← THIS WAS THE BUG
        $_SESSION['role']    = $user['role'];
        $_SESSION['name']    = $user['name'];

        unset($user['password']);
        echo json_encode(["success" => true, "user" => $user]);
    } else {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Invalid credentials"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Server error"]);
}
?>