<?php
require 'config.php';
session_start();

$stmt = $pdo->query("SELECT name, username, role, score, completed_tasks FROM users ORDER BY score DESC, completed_tasks DESC");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($users);
?>