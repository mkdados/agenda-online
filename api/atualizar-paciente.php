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

// Permitir apenas PATCH
if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método HTTP não permitido, use PATCH']);
    exit;
}

// Verificação da origem
if ($_SERVER['HTTP_HOST'] != $_ENV['DB_HOST']) {
    http_response_code(403);
    echo json_encode(['erro' => 'Acesso negado: origem não permitida']);
    exit;
}

// Lê dados brutos e decodifica JSON
$input = json_decode(file_get_contents('php://input'), true);

// Verifica ID
$id_paciente = isset($input['id_paciente']) ? intval($input['id_paciente']) : null;
if (!$id_paciente) {
    http_response_code(400);
    echo json_encode(['erro' => 'id_paciente é obrigatório']);
    exit;
}

// Verifica se o paciente existe
$stmt = $conn->prepare("SELECT id FROM tbl_paciente WHERE id = ?");
$stmt->bind_param("i", $id_paciente);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['erro' => 'Paciente não encontrado']);
    exit;
}
$stmt->close();

// Campos que podem ser atualizados
$campos = [
    'nome' => isset($input['nome']) ? trim($input['nome']) : null,
    'cpf' => isset($input['cpf']) ? trim($input['cpf']) : null,
    'data_nascimento' => isset($input['data_nascimento']) ? $input['data_nascimento'] : null,
    'celular' => isset($input['celular']) ? trim($input['celular']) : null,
    'email' => isset($input['email']) ? trim($input['email']) : null,
    'senha' => isset($input['senha']) ? $input['senha'] : null,
    'ativo' => isset($input['ativo']) ? strtoupper($input['ativo']) : null
];

// Remove campos nulos
$campos_filtrados = array_filter($campos, function ($v) {
    return !is_null($v);
});

// Nada para atualizar?
if (empty($campos_filtrados)) {
    http_response_code(400);
    echo json_encode(['erro' => 'Nenhum campo para atualizar']);
    exit;
}

// Prepara campos dinamicamente
$set_clause = [];
$param_types = '';
$param_values = [];

foreach ($campos_filtrados as $campo => $valor) {
    if ($campo === 'senha') {
        $valor = password_hash($valor, PASSWORD_BCRYPT);
    }
    $set_clause[] = "$campo = ?";
    $param_types .= 's';
    $param_values[] = $valor;
}

// Adiciona o ID ao final
$param_types .= 'i';
$param_values[] = $id_paciente;

$query = "UPDATE tbl_paciente SET " . implode(', ', $set_clause) . " WHERE id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param($param_types, ...$param_values);

// Executa e responde
try {
    $stmt->execute();
    echo json_encode([
        'mensagem' => 'Paciente atualizado com sucesso',
        'id_paciente' => $id_paciente
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro ao atualizar paciente',
        'detalhe' => $e->getMessage()
    ]);
}
