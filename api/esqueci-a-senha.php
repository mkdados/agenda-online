<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

include_once '../../../config/config.php'; // deve conter $conn (MySQLi)
include_once '../../../config/vendor/autoload.php';

header('Content-Type: application/json');

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

// Busca paciente
if ($tipo_busca === 'email') {
    $stmt = $conn->prepare("SELECT id, nome, email FROM tbl_paciente WHERE id_cliente = ? AND email = ? LIMIT 1");
} else {
    $stmt = $conn->prepare("SELECT id, nome, email FROM tbl_paciente WHERE id_cliente = ? AND cpf = ? LIMIT 1");
}

$stmt->bind_param("is", $id_cliente, $identificador);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['erro' => 'E-mail ou CPF não encontrado']);
    exit;
}

$paciente = $result->fetch_assoc();
$id_paciente = $paciente['id'];
$nome_paciente = $paciente['nome'];
$email_paciente = $paciente['email'];
$stmt->close();

// Gera token e insere na tabela de recuperação
$token = bin2hex(random_bytes(32));
$data_expiracao = date('Y-m-d H:i:s', strtotime('+1 hour'));

$stmt = $conn->prepare("
    INSERT INTO tbl_recuperacao_senha (id_cliente, id_paciente, token, data_expiracao)
    VALUES (?, ?, ?, ?)
");
$stmt->bind_param("iiss", $id_cliente, $id_paciente, $token, $data_expiracao);
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
$mail = new PHPMailer(true);
$mail->CharSet = 'UTF-8';
$mail->Encoding = 'base64';

try {
    $mail->isSMTP();
    $mail->Host       = $config['servidor_smtp'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $config['usuario'];
    $mail->Password   = $config['senha'];
    $mail->Port       = $config['porta'] ?? 587;

    $tipoSeguranca = strtolower(trim($config['tipo_seguranca']));
    if ($tipoSeguranca === 'ssl') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    } elseif ($tipoSeguranca === 'tls') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    }

    $mail->setFrom($config['email_remetente'], $config['nome_remetente']);
    $mail->addAddress($email_paciente, $nome_paciente);

    //Link de redefinição de senha
    $protocolo = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
    $dominio = $_SERVER['HTTP_HOST']; // Ex: localhost, meusite.com
    $caminho = "/agendaonline/redefinir-senha.html"; // Caminho que você quer fixo
    $link = $protocolo . $dominio . $caminho . "?token=$token";

    //Corpo do e-mail
    $mail->isHTML(true);
    $mail->Subject = 'Recuperação de Senha - Dermaclinica';
    $mail->Body = "
        <html>
        <body style='font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 10px;'>
            <div style='max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 6px;'>
                <h2 style='color: #d47d48;'>Recuperação de Senha - Dermaclinica</h2>
                <p>Olá <strong>{$nome_paciente}</strong>,</p>
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

    $mail->AltBody = "Olá {$nome_paciente}, acesse o link para redefinir sua senha: {$link}";

    $mail->send();

    echo json_encode(['mensagem' => 'E-mail de recuperação enviado com sucesso']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Falha ao enviar o e-mail', 'detalhe' => $mail->ErrorInfo]);
}

?>
