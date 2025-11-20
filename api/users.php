<?php
require 'config.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Login required"]);
    exit;
}

$stmt = $pdo->query("SELECT id, name, username, role, score, completed_tasks FROM users ORDER BY score DESC");
echo json_encode($stmt->fetchAll());
?>