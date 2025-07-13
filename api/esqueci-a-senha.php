<?php

include_once '../../../config/config.php';
include_once 'funcoes.php';
include_once 'init.php';
include_once 'email.php';
include_once 'log-integracao.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['erro' => 'JSON inválido']);
    exit;
}

$id_cliente = $_ENV['ID_CLIENTE'] ?? null;
if (!$id_cliente) {
    http_response_code(400);
    echo json_encode(['erro' => 'Cliente não identificado']);
    exit;
}

// Identifica por e-mail ou CPF
$identificador = null;
$tipo_busca = null;

if (!empty($input['email'])) {
    $identificador = strtolower(trim($input['email']));
    $tipo_busca = 'email';
} elseif (!empty($input['cpf'])) {
    $identificador = preg_replace('/\D/', '', $input['cpf']);
    $tipo_busca = 'cpf';
} else {
    http_response_code(400);
    echo json_encode(['erro' => 'Informe o e-mail ou CPF']);
    exit;
}

//Valida se é da medicina direta--------------------------------------
if($identificador=="34327560898" || $identificador=="mkdados@gmail.com"){
    $id_cliente = 2;
}

// Busca usuário
if ($tipo_busca === 'email') {
    $stmt = $conn->prepare("SELECT id, nome, email FROM tbl_usuario WHERE id_cliente = ? AND email = ? LIMIT 1");
} else {
    $stmt = $conn->prepare("SELECT id, nome, email FROM tbl_usuario WHERE id_cliente = ? AND cpf = ? LIMIT 1");
}

$stmt->bind_param("is", $id_cliente, $identificador);
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

// Gera token e insere na tabela de recuperação
$token = bin2hex(random_bytes(32));
$data_expiracao = date('Y-m-d H:i:s', strtotime('+1 hour'));

$stmt = $conn->prepare("
    INSERT INTO tbl_recuperacao_senha (id_cliente, id_usuario, token, data_expiracao)
    VALUES (?, ?, ?, ?)
");
$stmt->bind_param("iiss", $id_cliente, $id_usuario, $token, $data_expiracao);
$stmt->execute();
$stmt->close();

// Busca config de e-mail
$stmt = $conn->prepare("SELECT * FROM tbl_parametro_email WHERE id_cliente = ? AND ativo = 'S' LIMIT 1");
$stmt->bind_param("i", $id_cliente);
$stmt->execute();
$config = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$config) {
    http_response_code(500);
    echo json_encode(['erro' => 'Parâmetros de e-mail não encontrados']);
    exit;
}

// Prepara envio do e-mail
// Gera o link de redefinição
$protocolo = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
$dominio = $_SERVER['HTTP_HOST'];
$caminho = "/agendaonline/redefinir-senha.html";
$link = $protocolo . $dominio . $caminho . "?token=$token";

// Conteúdo do e-mail
$assunto = 'Recuperação de Senha - Dermaclinica';
$corpoHtml = "
    <html>
    <body style='font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 10px;'>
        <div style='max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 6px;'>
            <h2 style='color: #d47d48;'>Recuperação de Senha - Dermaclinica</h2>
            <p>Olá <strong>{$nome_usuario}</strong>,</p>
            <p>Identificamos seu pedido de recuperação de senha!</p>
            <p>Utilize o link abaixo para redefinir sua senha:</p>
            <p><a href='{$link}' style='background: #d47d48; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;'>🔗 Clique aqui para alterar sua senha</a></p>
            <hr>
            <p><strong>Telefone:</strong> 11 3660-4850<br>
               <strong>WhatsApp:</strong> 11 3660-4850<br>
               <strong>Instagram:</strong> @dermaclinicasp</p>
            <hr>
            <p style='font-size: 12px; color: #777;'>Essa é uma mensagem automática. Por favor, não responda.</p>
        </div>
    </body>
    </html>";

$corpoTexto = "Olá {$nome_usuario},\nAcesse o link para redefinir sua senha: {$link}";

// Envio
$retornoEmail = fn_envia_email($config, $nome_usuario, $email_usuario, $assunto, $corpoHtml, $corpoTexto);

if ($retornoEmail === true) {
    echo json_encode(['mensagem' => 'E-mail de recuperação enviado com sucesso']);
} else {
    http_response_code(500);
    echo json_encode(['erro' => 'Falha ao enviar o e-mail', 'detalhe' => $retornoEmail]);
}


?>
