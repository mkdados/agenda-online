<?php

include_once '../../../config/config.php'; 
include_once 'funcoes.php';
include_once 'init.php';
include_once 'curl.php';
include_once 'log-integracao.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input) || empty($input['token']) || empty($input['nova_senha'])) {
    http_response_code(400);
    echo json_encode(['erro' => 'Dados inválidos']);
    exit;
}

$token = trim($input['token']);
$novaSenha = $input['nova_senha'];

$id_cliente = $_ENV['ID_CLIENTE'] ?? null;
if (!$id_cliente) {
    http_response_code(400);
    echo json_encode(['erro' => 'Cliente não identificado']);
    exit;
}

// 🔒 Verifica se o token é válido
$stmt = $conn->prepare("
    SELECT id_usuario 
    FROM tbl_recuperacao_senha 
    WHERE id_cliente = ? 
      AND token = ? 
      AND status = '1' 
      AND data_expiracao > NOW()
    LIMIT 1
");
$stmt->bind_param("is", $id_cliente, $token);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(400);
    echo json_encode(['erro' => 'Token inválido, expirado ou já utilizado.']);
    exit;
}

$recuperacao = $result->fetch_assoc();
$id_usuario = $recuperacao['id_usuario'];
$stmt->close();

// ✅ Atualiza a senha do usuário
$senhaCriptografada = password_hash($novaSenha, PASSWORD_DEFAULT);

$stmt = $conn->prepare("UPDATE tbl_usuario SET senha = ? WHERE id = ? AND id_cliente = ?");
$stmt->bind_param("sii", $senhaCriptografada, $id_usuario, $id_cliente);
$stmt->execute();
$stmt->close();

// 🧹 Invalida o token (altera status para 0)
$stmt = $conn->prepare("UPDATE tbl_recuperacao_senha SET status = '0' WHERE token = ? AND id_cliente = ?");
$stmt->bind_param("si", $token, $id_cliente);
$stmt->execute();
$stmt->close();

echo json_encode(['mensagem' => 'Senha redefinida com sucesso']);

?>
