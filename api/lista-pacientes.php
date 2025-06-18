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
$id_usuario = isset($input['id_usuario']) ? intval($input['id_usuario']) : null;
$token = isset($input['token']) ? $input['token'] : null;

// Valida usuário
if (!$id_usuario) {
    http_response_code(400);
    echo json_encode(['erro' => 'id_usuario inválido ou não enviado']);
    exit;
}

// Valida token
if (!$token) {
    http_response_code(400);
    echo json_encode(['erro' => 'token inválido ou não enviado']);
    exit;
}

// Busca dados da integração
$nome_endpoint = 'LISTAR_PACIENTES';

$query = "
    SELECT c.id AS id_integracao, e.id AS id_integracao_endpoint, i.url as url, e.rota as rota, e.metodo_http, c.parametros
        FROM tbl_cliente_integracao c
    INNER JOIN tbl_integracao i ON i.id = c.id_integracao
    INNER JOIN tbl_integracao_endpoint e ON e.id_integracao = i.id
    WHERE c.id_cliente = ? AND e.nome = ?
    limit 1
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
$url_integracao         = $row["url"].$row["rota"];
$metodo_http            = $row["metodo_http"];
$parametros             = json_decode($row["parametros"], true) ?? [];
$request_body           = json_encode([]);
$params = [
    '$count' => 'true',
    '$filter' => "documento/cpf eq '47345287807'",
    '$expand' => 'convenio',
];

// Constrói a query string com URL encoding apropriado
$queryString = http_build_query($params);

// Concatena URL com query string
$url_integracao  = $url_integracao . '?' . $queryString;

// Inicializa cURL
$curl_result = fn_curl_request([
    'url' => $url_integracao,
    'metodo' => $metodo_http,
    'body' => $request_body,
    'headers' => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token
    ]
]);

$sucesso     = $curl_result['sucesso']     ?? 'N';
$response    = $curl_result['response']    ?? '';
$http_status = $curl_result['http_status'] ?? 0;
$curl_error  = $curl_result['erro']        ?? '';
$data        = $curl_result['data']        ?? [];

if(!empty($data)){
    http_response_code($http_status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}else{
    http_response_code($http_status);
    echo json_encode(["erro" => "Erro ao processar a requisição: " . $curl_error]);
    exit;
}

// Grava log
fn_log_integracao([
    'id_cliente' => $id_cliente,
    'id_integracao' => $id_integracao,
    'id_integracao_endpoint' => $id_integracao_endpoint,
    'id_usuario' => $id_usuario,
    'url_integracao' => $url_integracao,
    'metodo_http' => $metodo_http,
    'request_body' => $request_body,
    'response' => $response,
    'http_status' => $http_status,
    'sucesso' => $sucesso
]);



?>
