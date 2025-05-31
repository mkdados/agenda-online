<?php

// Detecta se está rodando localmente ou publicado
$isLocalhost = in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1']);

// Define caminho do vendor conforme ambiente
$vendorPath = $isLocalhost ? '../../config/vendor/autoload.php' : '../../../config/vendor/autoload.php';

// Verifica se o arquivo realmente existe
if (!file_exists($vendorPath)) {
    http_response_code(500);
    echo json_encode(['erro' => 'Arquivo autoload.php não encontrado']);
    exit;
}

// Carrega autoload e .env
require $vendorPath;
use Dotenv\Dotenv;

$envPath = $isLocalhost ? '../../config/' : '../../../config/';

$dotenv = Dotenv::createImmutable($envPath);
$dotenv->load();

// Conexão com banco de dados
$servername = $_ENV['DB_HOST'] ?? 'localhost';
$username   = $_ENV['DB_USERNAME'] ?? '';
$password   = $_ENV['DB_PASSWORD'] ?? '';
$dbname     = $_ENV['DB_DATABASE'] ?? '';
$id_cliente = $_ENV['ID_CLIENTE'] ?? '';
$id_integracao = $_ENV['ID_INTEGRACAO'] ?? '';

$conn = new mysqli($servername, $username, $password, $dbname);
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro na conexão com o banco']);
    exit;
}

?>
