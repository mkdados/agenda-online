<?php
header('Content-Type: application/json');

// URL permitida
$urlPermitida = 'http://localhost/agendaonline/teste-js.html';

// Verifica o Referer
$referer = $_SERVER['HTTP_REFERER'] ?? '';

if ($referer !== $urlPermitida) {
    http_response_code(403);
    echo json_encode(['erro' => 'Acesso negado: origem não permitida']);
    exit;
}

// Dados protegidos
$dados = [
    "TOKEN_ACESSO" => [
        "URL" => "https://api.etternum.com.br/autenticacao/acesso",
        "LOGIN" => "MARCOS",
        "SENHA" => "00aa43446a6ce84d12b21547220ac6634e22f1529da99affd79b34c577053c54",
        "PLATAFORMA" => "ANG"
    ],
    "AGENDA_DISPONIVEL" => [
        "URL" => "https://api.etternum.com.br/integracao/agenda/disponivel"
    ]
];

// Responde com os dados protegidos
echo json_encode($dados);
