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
    echo json_encode(['erro' => 'Dados inválidos ou ausentes']);
    exit;
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
    echo json_encode(['erro' => 'Campos obrigatórios ausentes']);
    exit;
}

// Validações
if (!validarCPF($cpf)) {
    http_response_code(400);
    echo json_encode(['erro' => 'CPF inválido']);
    exit;
}

if (!validarNome($nome)) {
    http_response_code(400);
    echo json_encode(['erro' => 'Informe nome e sobrenome válidos']);
    exit;
}

if ($data_nascimento && !validarDataNascimento($data_nascimento)) {
    http_response_code(400);
    echo json_encode(['erro' => 'Data de nascimento inválida']);
    exit;
}

if ($celular && !validarCelular($celular)) {
    http_response_code(400);
    echo json_encode(['erro' => 'Celular inválido']);
    exit;
}

// Verifica duplicidade CPF
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

// Verifica duplicidade email (se informado)
if (!empty($email)) {
    $verifica_email_stmt = $conn->prepare("SELECT id FROM tbl_paciente WHERE email = ?");
    $verifica_email_stmt->bind_param("s", $email);
    $verifica_email_stmt->execute();
    $result_email = $verifica_email_stmt->get_result();
    if ($result_email->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['erro' => 'E-mail já cadastrado']);
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

    // Log de sucesso
    //gravarLogIntegracao($conn, $id_cliente, 1, 1, $novo_id, $input, $response, 200, true);

} catch (Exception $e) {
    $erro = [
        'erro' => 'Erro ao inserir paciente',
        'detalhe' => $e->getMessage()
    ];
    http_response_code(500);
    echo json_encode($erro);

    // Log de erro
    //gravarLogIntegracao($conn, $id_cliente, 1, 1, null, $input, $erro, 500, false);
}

////////////////////////////////////////////////////////////////////////////////

function gravarLogIntegracao($conn, $id_cliente, $id_integracao, $id_endpoint, $id_paciente, $request, $response, $status_http, $sucesso)
{
    try {
        $ip = $_SERVER['REMOTE_ADDR'];
        $url = $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
        $metodo = $_SERVER['REQUEST_METHOD'];
        $request_json = json_encode($request, JSON_UNESCAPED_UNICODE);
        $response_json = json_encode($response, JSON_UNESCAPED_UNICODE);
        $sucesso_str = $sucesso ? '1' : '0';

        $log_stmt = $conn->prepare("
            INSERT INTO tbl_integracao_log 
            (id_cliente, id_integracao, id_integracao_endpoint, id_paciente, ip, url_utilizada, metodo_http, request, response, status_http, sucesso)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $log_stmt->bind_param(
            "iiiisssssis",
            $id_cliente,
            $id_integracao,
            $id_endpoint,
            $id_paciente,
            $ip,
            $url,
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
