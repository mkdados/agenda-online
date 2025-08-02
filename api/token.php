<?php

// Includes
include_once '../../../config/config.php'; 
include_once 'funcoes.php';
include_once 'init.php';
include_once 'curl.php';
include_once 'log-integracao.php';

// Apenas POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método HTTP não permitido']);
    exit;
}

// Lê entrada JSON
$input = json_decode(file_get_contents('php://input'), true);
$identificador = isset($input['identificador']) ? $input['identificador'] : null;
$id_usuario = isset($input['id_usuario']) ? intval($input['id_usuario']) : null;
$id_cliente = isset($input['id_cliente']) ? intval($input['id_cliente']) : $_ENV['ID_CLIENTE'];

// Valida cliente
if (!$id_cliente) {
    http_response_code(400);
    echo json_encode(['erro' => 'Cliente não identificado']);
    exit;
}

// Verifica se é CPF ou E-mail
$is_email = filter_var($identificador, FILTER_VALIDATE_EMAIL);
$campo = $is_email ? 'email' : 'cpf';

// Se for CPF, remove pontos e traços
if (!$is_email) {
    $identificador = preg_replace('/[\.\-]/', '', $identificador);
}

// ✅ Só valida se o id_usuario for informado
if ($id_usuario) {
    $verifica_stmt = $conn->prepare("SELECT id FROM tbl_usuario WHERE id_cliente = ? and id = ?");
    $verifica_stmt->bind_param("ii", $id_cliente, $id_usuario);
    $verifica_stmt->execute();
    $result_verifica = $verifica_stmt->get_result();

    if ($result_verifica->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['erro' => 'Usuário não encontrado']);
        exit;
    }
    $verifica_stmt->close();
}

// Busca dados da integração
$nome_endpoint = 'AUTENTICACAO';

$query = "
    SELECT i.id AS id_integracao, e.id AS id_integracao_endpoint, i.url as url, e.rota as rota, e.metodo_http, c.parametros
    FROM tbl_cliente_integracao c
    INNER JOIN tbl_integracao i ON i.id = c.id_integracao
    INNER JOIN tbl_integracao_endpoint e ON e.id_integracao = i.id
    WHERE c.id_cliente = ? AND e.nome = ?
    LIMIT 1
";
$stmt = $conn->prepare($query);
$stmt->bind_param("is", $id_cliente, $nome_endpoint);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["erro" => "Integração 'AUTENTICACAO' não encontrada"]);
    exit;
}

$row = $result->fetch_assoc();
$id_integracao          = $row["id_integracao"];
$id_integracao_endpoint = $row["id_integracao_endpoint"];
$url_integracao         = $row["url"] . $row["rota"];
$metodo_http            = $row["metodo_http"];
$parametros             = json_decode($row["parametros"], true) ?? [];

$id_organizacao = $parametros["id_organizacao"];
$login      = htmlspecialchars($parametros["Login"] ?? '');
$senha      = $parametros["Senha"] ?? '';
$plataforma = htmlspecialchars($parametros["plataforma"] ?? '');

// Monta corpo da requisição
$request_array = [
    "Login" => $login,
    "Senha" => $senha,
    "plataforma" => $plataforma
];

$request_body = json_encode($request_array);

// Requisição cURL
$curl_result = fn_curl_request([
    'url' => $url_integracao,
    'metodo' => $metodo_http,
    'body' => $request_body,
    'headers' => [
        'Content-Type: application/json'
    ]
]);

$sucesso     = $curl_result['sucesso']     ?? 'N';
$response    = $curl_result['response']    ?? '';
$http_status = $curl_result['http_status'] ?? 0;
$curl_error  = $curl_result['erro']        ?? '';
$data        = $curl_result['data']        ?? [];
$data["id_organizacao"] = $id_organizacao;

// Retorno
if ($sucesso === 'S' && !empty($data["chave"])) {
    http_response_code($http_status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} else {
    http_response_code($http_status);
    echo json_encode(["erro" => "Erro ao processar a requisição: " . $curl_error ]);
    exit;
}

// Remove a senha antes de gravar no log
$request_log_array = $request_array;
unset($request_log_array["Senha"]);
$request_body_log = json_encode($request_log_array);

// Log da integração
fn_log_integracao([
    'id_cliente' => $id_cliente,
    'id_integracao' => $id_integracao,
    'id_integracao_endpoint' => $id_integracao_endpoint,
    'id_usuario' => $id_usuario, // Mesmo que null
    'url_integracao' => $url_integracao,
    'metodo_http' => $metodo_http,
    'request_body' => $request_body_log, // Sem a senha
    'response' => $response,
    'http_status' => $http_status,
    'sucesso' => $sucesso
]);

?>
