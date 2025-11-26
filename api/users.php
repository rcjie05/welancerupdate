<?php
require 'config.php';

// Fix: Use the SAME session key as login.php (you were using 'user_id' here but 'id' in login!)
if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Login required"]);
    exit;
}

try {
    // ADD "photo" HERE — THIS WAS MISSING!
    $stmt = $pdo->query("SELECT id, name, username, role, photo, score, completed_tasks FROM users ORDER BY score DESC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Optional: Clean up null photos (prevents broken URLs)
    foreach ($users as &$user) {
        $user['photo'] = $user['photo'] ?: null;
    }

    echo json_encode($users);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error"]);
}
?>