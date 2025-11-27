<?php
session_start();
require 'config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['id'])) {
    echo json_encode([]);
    exit;
}

// Now works for everyone
$stmt = $pdo->query("
    SELECT id, name, username, role, photo, score, completed_tasks 
    FROM users 
    ORDER BY score DESC, name ASC
");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($users as &$u) {
    $u['id'] = (int)$u['id'];
    $u['photo'] = $u['photo'] ?: null;
    $u['score'] = (int)($u['score'] ?? 0);
    $u['completed_tasks'] = (int)($u['completed_tasks'] ?? 0);
}

echo json_encode($users);
?>