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

// Se for CPF, remove pontos e traços
if (!$is_email) {
    $identificador = preg_replace('/[\.\-]/', '', $identificador);
}

// Busca o usuário
$stmt = $conn->prepare("SELECT id, nome, cpf, data_nascimento, celular, email, senha FROM tbl_usuario WHERE $campo = ? AND ativo = 'S'");
$stmt->bind_param("s", $identificador);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(['erro' => 'Usuário / Senha incorreta']);
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

// Calcula a expiração da sessão (4 horas a partir de agora)
$expiracaoSessao = date('c', strtotime('+4 hours')); // formato ISO 8601

// Resposta de sucesso
echo json_encode([
    'mensagem' => 'Login realizado com sucesso',
    'usuario' => [
        'id_usuario' => $usuario['id'],
        'nome' => $usuario['nome'],
        'cpf' => $usuario['cpf'],
        'data_nascimento' => $usuario['data_nascimento'],
        'celular' => $usuario['celular'],
        'email' => $usuario['email'],
    ],
    'sessao' => [
        'expira_em' => $expiracaoSessao,
        'duracao' => 4 * 60 * 60 // em segundos (4 horas)
    ]
]);
