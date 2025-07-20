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
$id_usuario = isset($input['id_usuario']) ? intval($input['id_usuario']) : null;

// Valida usuário
if (!$id_usuario) {
    http_response_code(400);
    echo json_encode(['erro' => 'id_usuario inválido ou não enviado']);
    exit;
}

// Busca o usuário
$stmt = $conn->prepare("SELECT id, nome, cpf, data_nascimento, celular, email FROM tbl_usuario WHERE id = ? AND ativo = 'S'");
$stmt->bind_param("i", $id_usuario);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(['erro' => 'Usuário inválido']);
    exit;
}

$usuario = $result->fetch_assoc();
$stmt->close();

// Funções de formatação
function formatarCPF($cpf) {
    return preg_replace("/(\d{3})(\d{3})(\d{3})(\d{2})/", "$1.$2.$3-$4", $cpf);
}

function formatarData($data) {
    return date('d/m/Y', strtotime($data));
}

function formatarCelular($celular) {
    $celular = preg_replace('/\D/', '', $celular); // Remove qualquer não-dígito
    if (strlen($celular) === 11) {
        return preg_replace("/(\d{2})(\d{5})(\d{4})/", "($1) $2-$3", $celular);
    } elseif (strlen($celular) === 10) {
        return preg_replace("/(\d{2})(\d{4})(\d{4})/", "($1) $2-$3", $celular);
    }
    return $celular;
}

// Aplica máscaras
$usuario_formatado = [
    'id_usuario' => $usuario['id'],
    'nome' => $usuario['nome'],
    'cpf' => formatarCPF($usuario['cpf']),
    'data_nascimento' => formatarData($usuario['data_nascimento']),
    'celular' => formatarCelular($usuario['celular']),
    'email' => $usuario['email']
];

// Resposta de sucesso
echo json_encode(['usuario' => $usuario_formatado]);
