<?php

// Includes
include_once 'config.php';
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

// Verificação da origem
$urls_permitidas = ['localhost', 'mkdados.com.br'];
if (!in_array($_SERVER['HTTP_HOST'], $urls_permitidas)) {
    http_response_code(403);
    echo json_encode(['erro' => 'Acesso negado: origem não permitida']);
    exit;
}

// Lê entrada JSON
$input = json_decode(file_get_contents('php://input'), true);
$id_paciente = isset($input['id_paciente']) ? intval($input['id_paciente']) : null;

// Valida paciente
if (!$id_paciente) {
    http_response_code(400);
    echo json_encode(['erro' => 'id_paciente inválido ou não enviado']);
    exit;
}

$verifica_stmt = $conn->prepare("SELECT id FROM tbl_paciente WHERE id = ?");
$verifica_stmt->bind_param("i", $id_paciente);
$verifica_stmt->execute();
$result_verifica = $verifica_stmt->get_result();
if ($result_verifica->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['erro' => 'Paciente não encontrado']);
    exit;
}
$verifica_stmt->close();

// Busca dados da integração
$query = "
    SELECT c.id as id_integracao, e.id as id_integracao_endpoint, e.url, e.metodo_http, c.parametros
    FROM tbl_cliente_integracao c
    INNER JOIN tbl_integracao i ON i.id = c.id_integracao
    INNER JOIN tbl_integracao_endpoint e ON e.id_integracao = i.id
    WHERE c.id_cliente = ? AND i.id = ? AND e.nome = 'AUTENTICACAO'
";
$stmt = $conn->prepare($query);
$stmt->bind_param("ii", $id_cliente, $id_integracao);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["erro" => "Integração 'AUTENTICACAO' não encontrada"]);
    exit;
}

$row = $result->fetch_assoc();
$id_integracao_endpoint = $row["id_integracao_endpoint"];
$url_integracao         = $row["url"];
$metodo_http            = $row["metodo_http"];
$parametros             = json_decode($row["parametros"], true) ?? [];

$login  = htmlspecialchars($parametros["Login"] ?? '');
$senha  = htmlspecialchars($parametros["Senha"] ?? '');
$plataforma = htmlspecialchars($parametros["plataforma"] ?? '');

$request_body = json_encode([
    "Login" => $login,
    "Senha" => $senha,
    "plataforma" => $plataforma
]);

// Executa cURL
$curl = curl_init();
curl_setopt_array($curl, array(
    CURLOPT_URL => $url_integracao,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => $metodo_http,
    CURLOPT_POSTFIELDS => $request_body,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
));
$response = curl_exec($curl);
$http_status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
$curl_error = curl_error($curl);
curl_close($curl);

// Interpreta resposta
$data = json_decode($response, true);
$sucesso = (isset($data["token"]["chave"])) ? 'SIM' : 'NAO';
$ip_cliente = fn_get_ip();

// Grava log
try {
    $log_stmt = $conn->prepare("
        INSERT INTO tbl_integracao_log 
        (id_cliente, id_integracao, id_integracao_endpoint, id_paciente, ip, url_utilizada, metodo_http, request, response, status_http, sucesso)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $log_stmt->bind_param(
        "iiisssssssi",
        $id_cliente,
        $id_integracao,
        $id_integracao_endpoint,
        $id_paciente,
        $ip_cliente,
        $url_integracao,
        $metodo_http,
        $request_body,
        $response,
        $http_status,
        $sucesso
    );
    $log_stmt->execute();
    $log_stmt->close();
} catch (Exception $e) {
    error_log("Erro ao gravar log: " . $e->getMessage());
}

// Retorno final
if ($sucesso === 'NAO') {
    http_response_code(502);
    echo json_encode(["erro" => "Falha ao obter token", "detalhe" => $curl_error ?: "Resposta inválida"]);
    exit;
}

echo json_encode([
    "token" => [
        "chave" => htmlspecialchars($data["token"]["chave"]),
        "duracao" => htmlspecialchars($data["token"]["duracao"])
    ]
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

?>
