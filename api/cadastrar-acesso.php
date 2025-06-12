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

// Lê JSON enviado
$input = json_decode(file_get_contents('php://input'), true);

// Verifica se o JSON é válido
if (!is_array($input)) {
    http_response_code(400);
    $response = ['erro' => 'Dados inválidos ou ausentes'];
    gravarLogIntegracao($conn, $_ENV['ID_CLIENTE'] ?? null, null, [], $response, 400, false);
    echo json_encode($response);
    exit;
}

// Remove senha do input para log
$input_log = $input;
if (isset($input_log['senha'])) {
    $input_log['senha'] = '*********';
}

// Mapeia os campos
$id_cliente = $_ENV['ID_CLIENTE'] ?? null;
$nome = strtoupper(trim($input['nome'] ?? ''));
$cpf = preg_replace('/\D/', '', trim($input['cpf'] ?? ''));
$data_nascimento = $input['dataNascimento'] ?? null;
$celular = preg_replace('/\D/', '', trim($input['celular'] ?? ''));
$email = strtolower(trim($input['email'] ?? ''));
$senha = $input['senha'] ?? '';
$ativo = strtoupper($input['ativo'] ?? 'S');

// Validação de obrigatórios
if (!$id_cliente || !$nome || !$cpf || !$senha) {
    http_response_code(400);
    $response = ['erro' => 'Campos obrigatórios ausentes'];
    gravarLogIntegracao($conn, $id_cliente, null, $input_log, $response, 400, false);
    echo json_encode($response);
    exit;
}

// Validações
if (!validarCPF($cpf)) {
    http_response_code(400);
    $response = ['erro' => 'CPF inválido'];
    gravarLogIntegracao($conn, $id_cliente, null, $input_log, $response, 400, false);
    echo json_encode($response);
    exit;
}

if (!validarNome($nome)) {
    http_response_code(400);
    $response = ['erro' => 'Informe nome e sobrenome válidos'];
    gravarLogIntegracao($conn, $id_cliente, null, $input_log, $response, 400, false);
    echo json_encode($response);
    exit;
}

if ($data_nascimento && !validarDataNascimento($data_nascimento)) {
    http_response_code(400);
    $response = ['erro' => 'Data de nascimento inválida'];
    gravarLogIntegracao($conn, $id_cliente, null, $input_log, $response, 400, false);
    echo json_encode($response);
    exit;
}

if ($celular && !validarCelular($celular)) {
    http_response_code(400);
    $response = ['erro' => 'Celular inválido'];
    gravarLogIntegracao($conn, $id_cliente, null, $input_log, $response, 400, false);
    echo json_encode($response);
    exit;
}

if (strlen($senha) < 8) {
    http_response_code(400);
    $response = ['erro' => 'A senha deve conter no mínimo 8 caracteres'];
    gravarLogIntegracao($conn, $id_cliente, null, $input_log, $response, 400, false);
    echo json_encode($response);
    exit;
}

// Verifica duplicidade CPF
$verifica_stmt = $conn->prepare("SELECT id FROM tbl_paciente WHERE cpf = ?");
$verifica_stmt->bind_param("s", $cpf);
$verifica_stmt->execute();
$result = $verifica_stmt->get_result();
if ($result->num_rows > 0) {
    http_response_code(409);
    $response = ['erro' => 'CPF já cadastrado'];
    gravarLogIntegracao($conn, $id_cliente, null, $input_log, $response, 409, false);
    echo json_encode($response);
    exit;
}
$verifica_stmt->close();

// Verifica duplicidade email (se informado)
if (!empty($email)) {
    $verifica_email_stmt = $conn->prepare("SELECT id FROM tbl_paciente WHERE email = ?");
    $verifica_email_stmt->bind_param("s", $email);
    $verifica_email_stmt->execute();
    $result_email = $verifica_email_stmt->get_result();
    if ($result_email->num_rows > 0) {
        http_response_code(409);
        $response = ['erro' => 'E-mail já cadastrado'];
        gravarLogIntegracao($conn, $id_cliente, null, $input_log, $response, 409, false);
        echo json_encode($response);
        exit;
    }
    $verifica_email_stmt->close();
}

// Hash da senha
$senha_hash = password_hash($senha, PASSWORD_BCRYPT);

// Tenta inserir e registrar log
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

    $response = [
        'mensagem' => 'Acesso cadastrado com sucesso',
        'id_paciente' => $novo_id
    ];
    http_response_code(200);
    echo json_encode($response);

    gravarLogIntegracao($conn, $id_cliente, $novo_id, $input_log, $response, 200, true);

} catch (Exception $e) {
    $response = [
        'erro' => 'Erro ao inserir paciente',
        'detalhe' => $e->getMessage()
    ];
    http_response_code(500);
    gravarLogIntegracao($conn, $id_cliente, null, $input_log, $response, 500, false);
    echo json_encode($response);
}

// Função para gravar log de integração
function gravarLogIntegracao($conn, $id_cliente, $id_paciente, $request, $response, $status_http, $sucesso)
{
    try {
        $ip = fn_get_ip();
        $metodo = $_SERVER['REQUEST_METHOD'];
        $request_json = json_encode($request, JSON_UNESCAPED_UNICODE);
        $response_json = json_encode($response, JSON_UNESCAPED_UNICODE);
        $sucesso_str = $sucesso ? '1' : '0';

        // Busca dados da integração
        $nome_endpoint = 'CADASTRA_ACESSO';

        $query = "
            SELECT c.id AS id_integracao, e.id AS id_integracao_endpoint, i.url as url, e.rota as rota
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
            return;
        }

        $row = $result->fetch_assoc();
        $id_integracao          = $row["id_integracao"];
        $id_integracao_endpoint = $row["id_integracao_endpoint"];
        $url_integracao         = $row["url"] . $row["rota"];

        $log_stmt = $conn->prepare("
            INSERT INTO tbl_integracao_log 
            (id_cliente, id_integracao, id_integracao_endpoint, id_paciente, ip, url_utilizada, metodo_http, request, response, status_http, sucesso)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $log_stmt->bind_param(
            "iiiisssssis",
            $id_cliente,
            $id_integracao,
            $id_integracao_endpoint,
            $id_paciente,
            $ip,
            $url_integracao,
            $metodo,
            $request_json,
            $response_json,
            $status_http,
            $sucesso_str
        );
        $log_stmt->execute();
        $log_stmt->close();

    } catch (Exception $e) {
        error_log('Erro ao gravar log de integração: ' . $e->getMessage());
    }
}
?>
