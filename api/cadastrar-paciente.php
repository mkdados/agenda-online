<?php

// Includes
include_once '../../../config/config.php';
include_once 'funcoes.php';

// Cabeçalhos de segurança
header('Content-Type: application/json');
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");
header("Referrer-Policy: no-referrer");
header("Content-Security-Policy: default-src 'self'");

// Apenas POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método HTTP não permitido']);
    exit;
}

// Verificação da origem (se necessário)
if ($_SERVER['HTTP_HOST'] != $_ENV['DB_HOST']) {
    http_response_code(403);
    echo json_encode(['erro' => 'Acesso negado: origem não permitida']);
    exit;
}

// Lê entrada JSON
$input = json_decode(file_get_contents('php://input'), true);

// Validação básica dos campos obrigatórios
$id_cliente = isset($_ENV['ID_CLIENTE']) ? intval($_ENV['ID_CLIENTE']) : null;
$nome = trim($input['nome'] ?? '');
$cpf = trim($input['cpf'] ?? '');
$data_nascimento = $input['data_nascimento'] ?? null;
$celular = trim($input['celular'] ?? '');
$email = trim($input['email'] ?? '');
$senha = $input['senha'] ?? '';
$ativo = strtoupper($input['ativo'] ?? 'S');

if (!$id_cliente || !$nome || !$cpf || !$senha) {
    http_response_code(400);
    echo json_encode(['erro' => 'Campos obrigatórios ausentes']);
    exit;
}

// Verifica duplicidade (CPF)
$verifica_stmt = $conn->prepare("SELECT id FROM tbl_paciente WHERE cpf = ?");
$verifica_stmt->bind_param("s", $cpf);
$verifica_stmt->execute();
$result = $verifica_stmt->get_result();
if ($result->num_rows > 0) {
    http_response_code(409);
    echo json_encode(['erro' => 'CPF já cadastrado']);
    exit;
}
$verifica_stmt->close();

// Hash da senha
$senha_hash = password_hash($senha, PASSWORD_BCRYPT);

// Inserção no banco
try {
    $insert_stmt = $conn->prepare("
        INSERT INTO tbl_paciente 
        (id_cliente, nome, cpf, data_nascimento, celular, email, senha, ativo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $insert_stmt->bind_param(
        "isssssss",
        $id_cliente,
        $nome,
        $cpf,
        $data_nascimento,
        $celular,
        $email,
        $senha_hash,
        $ativo
    );
    $insert_stmt->execute();
    $novo_id = $insert_stmt->insert_id;
    $insert_stmt->close();

    echo json_encode([
        'mensagem' => 'Paciente cadastrado com sucesso',
        'id_paciente' => $novo_id
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro ao inserir paciente', 'detalhe' => $e->getMessage()]);
}
