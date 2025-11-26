<?php
require 'config.php';
if (!isset($_SESSION['id'])) die(json_encode(['error' => 'Login required']));

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['task_id'])) die(json_encode(['error' => 'Invalid data']));

$stmt = $pdo->prepare("UPDATE tasks SET title=?, user_id=?, points=? WHERE id=?");
$stmt->execute([
    $input['title'],
    $input['user_id'] ?: null,
    $input['points'],
    $input['task_id']
]);

echo json_encode(['success' => true]);
?>