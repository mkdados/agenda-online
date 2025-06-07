<?php

// Cabeçalhos de segurança
header('Content-Type: application/json');
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");
header("Referrer-Policy: no-referrer");
header("Content-Security-Policy: default-src 'self'");

if (!isset($_ENV['DB_HOST']) or $_SERVER['HTTP_HOST']!=$_ENV['DB_HOST']) {
    http_response_code(403);
    echo json_encode(['erro' => 'Acesso negado: origem não permitida']);
    exit;
}

?>