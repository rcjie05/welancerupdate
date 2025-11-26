<?php
require 'config.php';
if (!isset($_SESSION['id'])) die(json_encode(['error' => 'Login required']));

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['project_id'])) die(json_encode(['error' => 'Invalid data']));

$stmt = $pdo->prepare("UPDATE projects SET name=?, manager_id=?, points=?, task_quantity=? WHERE id=?");
$stmt->execute([
    $input['name'],
    $input['manager_id'] ?: null,
    $input['points'],
    $input['task_quantity'],
    $input['project_id']
]);

echo json_encode(['success' => true]);
?>