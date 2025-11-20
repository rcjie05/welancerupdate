<?php
require 'config.php';
if ($_SESSION['role'] !== 'admin') die(json_encode(['error'=>'Only admin']));

$data = json_decode(file_get_contents('php://input'), true);
$name = $data['name'] ?? '';
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';
$role = $data['role'] ?? 'member';

if (strlen($password) < 6) die(json_encode(['error'=>'Password too short']));

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare("INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)");
$stmt->execute([$name, $username, $hash, $role]);

echo json_encode(['success'=>true]);
?>