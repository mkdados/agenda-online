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
$id_usuario     = isset($input['id_usuario']) ? intval($input['id_usuario']) : null;
$token          = $input['token'] ?? null;
$id_filial      = isset($input['id_filial']) ? intval($input['id_filial']) : null;
$id_profissional= $input['id_profissional'] ?? null;
$data_inicio    = $input['data_inicio'] ?? date("Y-m-d");
$data_fim       = $input['data_fim'] ?? date("Y-m-d", strtotime("+7 days"));

// Validações
if (!$id_usuario) {
    http_response_code(400);
    echo json_encode(['erro' => 'id_usuario inválido ou não enviado']);
    exit;
}
if (!$token) {
    http_response_code(400);
    echo json_encode(['erro' => 'token inválido ou não enviado']);
    exit;
}

// Busca dados da integração
$nome_endpoint = 'LISTAR_AGENDADAMENTOS';

$query = "
    SELECT c.id AS id_integracao, e.id AS id_integracao_endpoint, i.url as url, e.rota as rota, e.metodo_http, c.parametros
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
    echo json_encode(["erro" => "Integração 'LISTAR_AGENDADAMENTOS' não encontrada"]);
    exit;
}

$row = $result->fetch_assoc();
$id_integracao          = $row["id_integracao"];
$id_integracao_endpoint = $row["id_integracao_endpoint"];
$url_integracao         = $row["url"] . $row["rota"];
$metodo_http            = $row["metodo_http"];
$parametros             = json_decode($row["parametros"], true) ?? [];
$request_body           = json_encode([]);

// ----------------------
// Montagem dinâmica do $apply
// ----------------------
$filtrosApply = [];

if (!empty($id_filial)) {
    $filtrosApply[] = "filialId eq $id_filial";
}
if (!empty($id_profissional)) {
    $filtrosApply[] = "profissionalId eq $id_profissional";
}
if (!empty($data_inicio)) {
    $filtrosApply[] = "dataInicio ge $data_inicio";
}
if (!empty($data_fim)) {
    $filtrosApply[] = "dataInicio le $data_fim";
}

$applyFiltro = count($filtrosApply) > 0 
    ? "filter(" . implode(" and ", $filtrosApply) . ")"
    : "";
// ----------------------
// Query string
// ----------------------
$params = [ 
    '$select' => "id,organizacaoId,filialId,profissionalId,dataInicio,horaInicio,horaFim",
    '$apply'  => $applyFiltro,
    'orderby' => "dataInicio"
];

$queryString = http_build_query($params, '', '&', PHP_QUERY_RFC3986);
$url_integracao = $url_integracao . '?' . $queryString;

// ----------------------
// Requisição cURL
// ----------------------
$curl_result = fn_curl_request([
    'url' => $url_integracao,
    'metodo' => $metodo_http,
    'body' => $request_body,
    'headers' => [
        "datainicio: $data_inicio",
        "dataFim: $data_fim",
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token
    ]
]);

$sucesso     = $curl_result['sucesso']     ?? 'N';
$response    = $curl_result['response']    ?? '';
$http_status = $curl_result['http_status'] ?? 0;
$curl_error  = $curl_result['erro']        ?? '';
$data        = $curl_result['data']        ?? [];

// ----------------------
// Retorno
// ----------------------
if (!empty($data)) {
    http_response_code($http_status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} else {
    http_response_code($http_status);
    echo json_encode(["erro" => "Erro ao processar a requisição: " . $curl_error]);
}

// ----------------------
// Log
// ----------------------
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
