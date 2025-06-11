<?php

function validarCPF($cpf) {
    $cpf = preg_replace('/\D/', '', $cpf);
    if (strlen($cpf) !== 11 || preg_match('/(\d)\1{10}/', $cpf)) return false;

    for ($t = 9; $t < 11; $t++) {
        $d = 0;
        for ($c = 0; $c < $t; $c++) {
            $d += $cpf[$c] * (($t + 1) - $c);
        }
        $d = ((10 * $d) % 11) % 10;
        if ($cpf[$c] != $d) return false;
    }
    return true;
}

function validarNome($nome) {
    $partes = explode(' ', trim($nome));
    return count($partes) >= 2 && strlen($partes[0]) >= 2 && strlen(end($partes)) >= 2;
}

function validarDataNascimento($data) {
    $partes = explode('-', $data);
    if (count($partes) !== 3) return false;

    [$ano, $mes, $dia] = $partes;
    if (!checkdate((int)$mes, (int)$dia, (int)$ano)) return false;

    try {
        $hoje = new DateTime();
        $nascimento = new DateTime($data);
    } catch (Exception $e) {
        return false;
    }

    $idade = $hoje->diff($nascimento)->y;
    return $nascimento <= $hoje && $idade >= 0 && $idade <= 120;
}


function validarCelular($celular) {
    $celular = preg_replace('/\D/', '', $celular);
    return preg_match('/^\d{2}9\d{8}$/', $celular);
}


function fn_get_ip() {
    $ip = '';

    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ipList = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        $ip = trim($ipList[0]);
    } elseif (!empty($_SERVER['REMOTE_ADDR'])) {
        $ip = $_SERVER['REMOTE_ADDR'];
    }

    // Converte IPv6 localhost (::1) para IPv4
    if ($ip === '::1') {
        $ip = '127.0.0.1';
    }

    return $ip;
}



?>