<?php
error_reporting(0);
ini_set('display_errors', 0);
session_start();

// === CORS FOR LIVE SERVER (127.0.0.1:5500) ===
if (isset($_SERVER['HTTP_ORIGIN'])) {
    if ($_SERVER['HTTP_ORIGIN'] === 'http://127.0.0.1:5500') {
        header("Access-Control-Allow-Origin: http://127.0.0.1:5500");
    } else {
        header("Access-Control-Allow-Origin: http://localhost");
    }
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// === DATABASE CONNECTION ===
$host = 'localhost';
$db   = 'welancer';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(Exception $e) {
    http_response_code(500);
    die(json_encode(["error" => $e->getMessage()]));
}
?>