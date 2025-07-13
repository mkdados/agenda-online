<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function fn_envia_email($config, $destinatario_nome, $destinatario_email, $assunto, $corpoHtml, $corpoTexto){
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
        $mail->addAddress($destinatario_email, $destinatario_nome);

        $mail->isHTML(true);
        $mail->Subject = $assunto;
        $mail->Body    = $corpoHtml;
        $mail->AltBody = $corpoTexto;

        $mail->send();
        return true;

    } catch (Exception $e) {
        return $mail->ErrorInfo;
    }
}


?>