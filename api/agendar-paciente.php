<?php

// Includes
include_once '../../../config/config.php'; 
include_once 'funcoes.php';
include_once 'init.php';
include_once 'curl.php';
include_once 'email.php';
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
$id_organizacao = isset($input['id_organizacao']) ? intval($input['id_organizacao']) : null;
$token = isset($input['token']) ? $input['token'] : null;
$data = $input['data'] ?? null;
$dados_agendamento = $input['dados_agendamento'] ?? null;
$id = $data['id'] ?? null;
$id_paciente = $data['pacienteId'] ?? null;

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

//Valida data
if (!$data || !is_array($data)) {
    http_response_code(400);
    echo json_encode(['erro' => 'Dados de agendamento inválidos ou não enviados']);
    exit;
}

//Valida id do agendamento
if (!$id) {
    http_response_code(400);
    echo json_encode(['erro' => 'ID do agendamento não informado']);
    exit;
}

//Valida id do paciente
if (!$id_paciente) {
    http_response_code(400);
    echo json_encode(['erro' => 'Não foi possível identificar o paciente']);
    exit;
}

// Busca dados da integração
$nome_endpoint = 'AGENDAR_PACIENTE';

$query = "
    SELECT i.id AS id_integracao, e.id AS id_integracao_endpoint, i.url as url, e.rota as rota, e.metodo_http, c.parametros
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
    echo json_encode(["mensagem" => "Integração 'AUTENTICACAO' não encontrada"]);
    exit;
}

$row = $result->fetch_assoc();
$id_integracao          = $row["id_integracao"];
$id_integracao_endpoint = $row["id_integracao_endpoint"];
$url_integracao         = $row["url"].$row["rota"];
$metodo_http            = $row["metodo_http"];
$parametros             = json_decode($row["parametros"], true) ?? [];
$request_body           = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

// Concatena URL com query string
$url_integracao  = $url_integracao . '/' . $id;

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

    //Envia e-mail de confirmação=====================================================

    // Busca config de e-mail
    $stmt = $conn->prepare("SELECT * FROM tbl_parametro_email WHERE id_cliente = ? AND ativo = 'S' LIMIT 1");
    $stmt->bind_param("i", $id_cliente);
    $stmt->execute();
    $config = $stmt->get_result()->fetch_assoc();
    $stmt->close();  

    // Busca usuário
    if ($id_organizacao == 7) {
        $id_cliente = 2; // Medicina Direta
    }

    $stmt = $conn->prepare("SELECT id, nome, email FROM tbl_usuario WHERE id_cliente = ? AND id = ? LIMIT 1");

    $stmt->bind_param("is", $id_cliente, $id_usuario);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['erro' => 'E-mail ou CPF não encontrado']);
        exit;
    }

    $usuario = $result->fetch_assoc();
    $id_usuario = $usuario['id'];
    $nome_usuario = $usuario['nome'];
    $email_usuario = $usuario['email'];
    $stmt->close();

    // E-mail==================================
        $data_agendamento = "{$dados_agendamento['data_agendamento']} às {$dados_agendamento['hora_agendamento']}"; 
        $nome_medico      = $dados_agendamento['nome_profissional'];
        $endereco_clinica = $dados_agendamento['endereco_unidade'];

        $assunto = 'Confirmação de Agendamento - Dermaclinica';

        $corpoHtml = "
        <html>
        <body style='font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 10px;'>
            <div style='max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 6px;'>
                <h2 style='color: #d47d48;'> Dermaclinica - Agendamento realizado com sucesso!</h2>

                <p><strong>Olá, {$nome_usuario}!</strong></p>
                <p>Esta é a confirmação de sua marcação:</p>

                <p>
                    📅 <strong>Data:</strong> {$data_agendamento}<br>
                    🩺 <strong>Médico:</strong> {$nome_medico}<br>
                    📍 <strong>Endereço:</strong> {$endereco_clinica}
                </p>

                <div style='margin-top: 20px; background-color: #fff3cd; padding: 10px; border: 1px solid #ffeeba; border-radius: 4px;'>
                    ⚠️ <strong>Atenção:</strong> Caso a clínica <strong>não seja credenciada</strong> ao tipo/categoria do seu plano, entraremos em contato para apresentar outras opções de agendamento.
                </div>

                <hr style='margin: 30px 0;color: #d47d48;'>

                <p><strong>Informações de Contato:</strong><br>
                📞 Telefone: (11) 3660-4850<br>
                💬 WhatsApp: (11) 3660-4850<br>
                📷 Instagram: <a href='https://www.instagram.com/dermaclinicasp' target='_blank'>@dermaclinicasp</a></p>

                <hr style='color: #d47d48;'>
                <p style='font-size: 12px; color: #777;'>Esta é uma mensagem automática. Por favor, não responda este e-mail.</p>
            </div>
        </body>
        </html>
        ";

        $corpoTexto = "Olá {$nome_usuario},\n\nSeu agendamento foi confirmado com sucesso!\n\nData: {$data_agendamento}\nProfissional: {$nome_medico}\nLocal: {$endereco_clinica}\n\nAtenção: Caso a clínica não seja credenciada ao tipo/categoria do seu plano, entraremos em contato para apresentar outras opções.\n\nTelefone/WhatsApp: (11) 3660-4850\nInstagram: @dermaclinicasp\n\n(Dermaclinica - mensagem automática)";
    
    fn_envia_email($config, $nome_usuario, $email_usuario, $assunto, $corpoHtml, $corpoTexto);

    // if ($retornoEmail === true) {
    //     echo json_encode(['mensagem' => 'E-mail de recuperação enviado com sucesso']);
    // } else {
    //     http_response_code(500);
    //     echo json_encode(['erro' => 'Falha ao enviar o e-mail', 'detalhe' => $retornoEmail]);
    // }


    //========================================
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
