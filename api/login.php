<?php
session_start();
require 'config.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['username']) || empty($input['password'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing credentials"]);
    exit;
}

$username = trim($input['username']);
$password = $input['password'];

try {
    $stmt = $pdo->prepare("SELECT id, name, username, password, role, photo, score, completed_tasks FROM users WHERE username = ? LIMIT 1");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password'])) {
        
        // REGENERATE SESSION ID (Security best practice)
        session_regenerate_id(true);

        // === CRITICAL: ONLY THESE SESSION KEYS ===
        $_SESSION['id']    = (int)$user['id'];
        $_SESSION['role']  = $user['role'];
        $_SESSION['name']  = $user['name'];
        $_SESSION['logged_in'] = true;
        $_SESSION['login_time'] = time();

        // Remove password before sending to frontend
        unset($user['password']);

        echo json_encode([
            "success" => true,
            "user" => [
                "id"       => (int)$user['id'],
                "name"     => $user['name'],
                "username" => $user['username'],
                "role"     => $user['role'],
                "photo"    => $user['photo'],
                "score"    => (int)($user['score'] ?? 0),
                "completed_tasks" => (int)($user['completed_tasks'] ?? 0)
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Invalid username or password"]);
    }

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Server error"]);
}
?>