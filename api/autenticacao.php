<?php
header('Content-Type: application/json');
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");
header("Referrer-Policy: no-referrer");
header("Content-Security-Policy: default-src 'self'");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método HTTP não permitido']);
    exit;
}

$urls_permitidas = ['localhost', 'mkdados.com.br'];
if (!in_array($_SERVER['HTTP_HOST'], $urls_permitidas)) {
    http_response_code(403);
    echo json_encode(['erro' => 'Acesso negado: origem não permitida']);
    exit;
}

// Conexão com banco
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "agendaonline";
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro na conexão com o banco de dados']);
    exit;
}

$id_cliente = 1;
$id_integracao = 1;
$id_paciente = null;

$stmt = $conn->prepare("
    SELECT c.id, i.url, i.metodo_http, c.token_autenticacao, c.parametros
    FROM tbl_cliente_integracao c
    INNER JOIN tbl_integracao i ON i.id = c.id_integracao
    WHERE c.id_cliente = ? AND c.id_integracao = ?
");
$stmt->bind_param("ii", $id_cliente, $id_integracao);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["erro" => "Nenhum resultado encontrado."]);
    $stmt->close();
    $conn->close();
    exit;
}

$row = $result->fetch_assoc();
$url_integracao     = $row["url"];
$metodo_http        = $row["metodo_http"];
$token_autenticacao = $row["token_autenticacao"];
$parametros         = json_decode($row["parametros"], true) ?? [];

$login_autenticacao      = htmlspecialchars($parametros["Login"] ?? '');
$senha_autenticacao      = htmlspecialchars($parametros["Senha"] ?? '');
$plataforma_autenticacao = htmlspecialchars($parametros["plataforma"] ?? '');

$stmt->close();

// Monta corpo da requisição
$request_body = json_encode([
    "Login" => $login_autenticacao,
    "Senha" => $senha_autenticacao,
    "plataforma" => $plataforma_autenticacao
]);

// Faz chamada CURL
$curl = curl_init();
curl_setopt_array($curl, array(
    CURLOPT_URL => $url_integracao,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => '',
    CURLOPT_MAXREDIRS => 5,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => $metodo_http,
    CURLOPT_POSTFIELDS => $request_body,
    CURLOPT_HTTPHEADER => array(
        'Content-Type: application/json'
    ),
));

$response = curl_exec($curl);
$http_status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
$curl_error = curl_error($curl);
curl_close($curl);

$data = json_decode($response, true);
$sucesso = (isset($data["token"]["chave"])) ? 'SIM' : 'NAO';

// LOG no banco
$log_stmt = $conn->prepare("
    INSERT INTO tbl_integracao_log 
    (data_registro, id_cliente, id_integracao, id_paciente, url_utilizada, metodo_http, request, response, status_http, sucesso)
    VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
");
$log_stmt->bind_param(
    "iiissssis",
    $id_cliente,
    $id_integracao,
    $id_paciente,
    $url_integracao,
    $metodo_http,
    $request_body,
    $response,
    $http_status,
    $sucesso
);
$log_stmt->execute();
$log_stmt->close();

$conn->close();

// Retorno ao cliente
if ($sucesso === 'NAO') {
    http_response_code(502);
    echo json_encode(["erro" => "Falha ao obter token", "detalhe" => $curl_error ?: "Resposta inválida"]);
    exit;
}

$dados = [
    "token" => [
        "chave"   => htmlspecialchars($data["token"]["chave"]),
        "duracao" => htmlspecialchars($data["token"]["duracao"])
    ]
];

echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
?>
