<?php

// Includes
include_once '../../../config/config.php';
include_once 'funcoes.php';
include_once 'init.php';

// Apenas POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método HTTP não permitido']);
    exit;
}

// Lê entrada JSON
$input = json_decode(file_get_contents('php://input'), true);

// Captura e normaliza os dados
$identificador = trim($input['identificador'] ?? '');
$senha = $input['senha'] ?? '';

if (!$identificador || !$senha) {
    http_response_code(400);
    echo json_encode(['erro' => 'Identificador (CPF ou e-mail) e senha são obrigatórios']);
    exit;
}

// Verifica se é CPF ou E-mail
$is_email = filter_var($identificador, FILTER_VALIDATE_EMAIL);
$campo = $is_email ? 'email' : 'cpf';

// Busca o paciente
$stmt = $conn->prepare("SELECT id, nome, cpf, email, senha FROM tbl_paciente WHERE $campo = ? AND ativo = 'S'");
$stmt->bind_param("s", $identificador);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(['erro' => 'Usuário não encontrado ou inativo']);
    exit;
}

$usuario = $result->fetch_assoc();
$stmt->close();

// Verifica a senha
if (!password_verify($senha, $usuario['senha'])) {
    http_response_code(401);
    echo json_encode(['erro' => 'Usuário / Senha incorreta']);
    exit;
}

// Resposta de sucesso
echo json_encode([
    'mensagem' => 'Login realizado com sucesso',
    'usuario' => [
        'id' => $usuario['id'],
        'nome' => $usuario['nome'],
        'cpf' => $usuario['cpf'],
        'email' => $usuario['email']
    ]
]);
