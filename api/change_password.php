<?php
require 'config.php';
if (!isset($_SESSION['id'])) die(json_encode(['success'=>false]));

$data = json_decode(file_get_contents('php://input'), true);
$old = $data['old_password'] ?? '';
$new = $data['new_password'] ?? '';

$stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
$stmt->execute([$_SESSION['id']]);
$user = $stmt->fetch();

if ($user && password_verify($old, $user['password'])) {
    $hash = password_hash($new, PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE users SET password = ? WHERE id = ?")
        ->execute([$hash, $_SESSION['id']]);
    echo json_encode(['success'=>true]);
} else {
    http_response_code(400);
    echo json_encode(['success'=>false, 'message'=>'Wrong current password']);
}
?>