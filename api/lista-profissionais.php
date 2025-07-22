<?php

// Includes
include_once '../../../config/config.php';
include_once 'funcoes.php';
include_once 'init.php';
include_once 'curl.php';
include_once 'log-integracao.php';

// Apenas POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método HTTP não permitido']);
    exit;
}

// Entrada JSON
$input = json_decode(file_get_contents('php://input'), true);
$id_usuario     = isset($input['id_usuario']) ? intval($input['id_usuario']) : null;
$token          = $input['token'] ?? null;
$id_profissional = $input['id_profissional'] ?? null;

// Validações
if (!$id_usuario) {
    http_response_code(400);
    echo json_encode(['erro' => 'id_usuario inválido ou não enviado']);
    exit;
}
if (!$token) {
    http_response_code(400);
    echo json_encode(['erro' => 'token inválido ou não enviado']);
    exit;
}
if (!$id_profissional) {
    http_response_code(400);
    echo json_encode(['erro' => 'id_profissional inválido ou não enviado']);
    exit;
}

// Normaliza os IDs
if (is_string($id_profissional)) {
    $ids_profissionais = array_map('intval', explode(',', $id_profissional));
} elseif (is_array($id_profissional)) {
    $ids_profissionais = array_map('intval', $id_profissional);
} else {
    http_response_code(400);
    echo json_encode(['erro' => 'Formato de id_profissional inválido']);
    exit;
}

// Diretórios
$diretorio_fotos = '../assets/images/medicos/';
$url_base_fotos  = '../assets/images/medicos/';
$caminho_foto_padrao = $diretorio_fotos . 'foto-medico.png';

if (!file_exists($diretorio_fotos)) {
    mkdir($diretorio_fotos, 0755, true);
}

// Verifica se a imagem padrão existe
if (!file_exists($caminho_foto_padrao)) {
    // Você pode criar um PNG vazio, logar ou lançar erro aqui
    file_put_contents('debug.log', "⚠️ Imagem padrão não encontrada: $caminho_foto_padrao\n", FILE_APPEND);
}

// Busca dados da integração
$nome_endpoint = 'LISTAR_PROFISSIONAIS';
$query = "
    SELECT c.id AS id_integracao, e.id AS id_integracao_endpoint, i.url as url, e.rota as rota, e.metodo_http, c.parametros
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
    http_response_code(404);
    echo json_encode(["erro" => "Integração 'LISTAR_PROFISSIONAIS' não encontrada"]);
    exit;
}

$row = $result->fetch_assoc();
$id_integracao          = $row["id_integracao"];
$id_integracao_endpoint = $row["id_integracao_endpoint"];
$url_integracao_base    = rtrim($row["url"], '/') . $row["rota"];
$metodo_http            = $row["metodo_http"];

// Monta a URL da requisição única
$ids_string = implode(',', $ids_profissionais);
$params = [
    '$select' => 'id,organizacaoId,nome,foto',
    '$filter' => 'id in (' . $ids_string . ')'
];
$queryString = http_build_query($params);
$url_final = $url_integracao_base . '?' . $queryString;

$request_body = json_encode([]);

$curl_result = fn_curl_request([
    'url' => $url_final,
    'metodo' => $metodo_http,
    'body' => $request_body,
    'headers' => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token
    ]
]);

$sucesso     = $curl_result['sucesso'] ?? 'N';
$data        = $curl_result['data'] ?? null;
$erro        = $curl_result['erro'] ?? '';
$http_status = $curl_result['http_status'] ?? 0;
$response    = $curl_result['response'] ?? '';

$dados_profissionais = [];
$erros = [];

// Trata resposta com metadados (formato Etternum OData)
if ($sucesso === 'S' && is_array($data)) {
    // Resposta geralmente é: [metadado, array_de_objetos]
    $possivel_lista = null;

    // Se segundo item for array com os dados
    if (isset($data['value']) && is_array($data['value'])) {
        $possivel_lista = $data['value'];
    }

    if ($possivel_lista) {
        foreach ($possivel_lista as $profissional) {
            if (!isset($profissional['id'])) {
                continue;
            }

            $id = $profissional['id'];
            $caminho_arquivo = $diretorio_fotos . $id . '.png';

            // Trata imagem
            if (!empty($profissional['foto'])) {
                $foto_decodificada = base64_decode($profissional['foto']);
                if ($foto_decodificada !== false) {
                    $image = imagecreatefromstring($foto_decodificada);
                    if ($image !== false) {
                        $resized = imagecreatetruecolor(90, 90);
                        imagealphablending($resized, false);
                        imagesavealpha($resized, true);
                        $transparent = imagecolorallocatealpha($resized, 0, 0, 0, 127);
                        imagefilledrectangle($resized, 0, 0, 90, 90, $transparent);

                        imagecopyresampled(
                            $resized, $image,
                            0, 0, 0, 0,
                            90, 90,
                            imagesx($image), imagesy($image)
                        );

                        imagepng($resized, $caminho_arquivo);
                        imagedestroy($resized);
                        imagedestroy($image);
                    } else {
                        copy($caminho_foto_padrao, $caminho_arquivo);
                    }
                } else {
                    copy($caminho_foto_padrao, $caminho_arquivo);
                }
            } else {
                copy($caminho_foto_padrao, $caminho_arquivo);
            }

            $profissional['foto_url'] = $url_base_fotos . $id . '.png?v=' . time();
            $dados_profissionais[] = $profissional;
        }
    } else {
        $erros[] = ['erro' => 'Estrutura de dados inesperada', 'data_recebida' => $data];
    }
} else {
    $erros[] = [
        'ids_profissionais' => $ids_profissionais,
        'erro' => $erro,
        'http_status' => $http_status
    ];
}

// Log da integração
fn_log_integracao([
    'id_cliente' => $id_cliente,
    'id_integracao' => $id_integracao,
    'id_integracao_endpoint' => $id_integracao_endpoint,
    'id_usuario' => $id_usuario,
    'url_integracao' => $url_final,
    'metodo_http' => $metodo_http,
    'request_body' => $request_body,
    'response' => $response,
    'http_status' => $http_status,
    'sucesso' => $sucesso
]);

// Resposta final
http_response_code(200);
echo json_encode([
    'dados' => $dados_profissionais,
    'erros' => $erros
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
exit;

?>
