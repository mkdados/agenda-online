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

// Lê entrada JSON
$input = json_decode(file_get_contents('php://input'), true);
$id_usuario = isset($input['id_usuario']) ? intval($input['id_usuario']) : null;
$token = isset($input['token']) ? $input['token'] : null;
$id_profissional = isset($input['id_profissional']) ? $input['id_profissional'] : null;

// Valida usuário e token
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

// Valida id_profissional
if (!$id_profissional) {
    http_response_code(400);
    echo json_encode(['erro' => 'id_profissional inválido ou não enviado']);
    exit;
}

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
$url_base_fotos = '../assets/images/medicos/';

// Garante que o diretório existe
if (!file_exists($diretorio_fotos)) {
    mkdir($diretorio_fotos, 0755, true);
}

$caminho_foto_padrao = $diretorio_fotos . 'foto-medico.png';

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
$parametros             = json_decode($row["parametros"], true) ?? [];

$request_body = json_encode([]);
$dados_profissionais = [];
$erros = [];

foreach ($ids_profissionais as $id) {
    $params = [
        '$select' => "id,organizacaoId,nome,foto,conselhoNumero"
    ];
    $queryString = http_build_query($params);
    $url_final = $url_integracao_base . '/' . $id . '?' . $queryString;

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

    if ($sucesso === 'S' && $data) {
        $caminho_arquivo = $diretorio_fotos . $data['id'] . '.png';

        if (!empty($data['foto'])) {
            $foto_base64 = $data['foto'];
            $foto_decodificada = base64_decode($foto_base64);

            if ($foto_decodificada !== false) {
                $image = imagecreatefromstring($foto_decodificada);

                if ($image !== false) {
                    // Cria nova imagem 90x90 com fundo transparente
                    $width = 90;
                    $height = 90;
                    $image_resized = imagecreatetruecolor($width, $height);

                    // Preserve transparência
                    imagealphablending($image_resized, false);
                    imagesavealpha($image_resized, true);
                    $transparent = imagecolorallocatealpha($image_resized, 0, 0, 0, 127);
                    imagefilledrectangle($image_resized, 0, 0, $width, $height, $transparent);

                    // Redimensiona mantendo transparência
                    imagecopyresampled(
                        $image_resized, $image,
                        0, 0, 0, 0,
                        $width, $height,
                        imagesx($image), imagesy($image)
                    );

                    // Salva imagem redimensionada
                    imagepng($image_resized, $caminho_arquivo);

                    imagedestroy($image_resized);
                    imagedestroy($image);
                } else {
                    // Falha ao criar imagem da string: usa padrão
                    copy($caminho_foto_padrao, $caminho_arquivo);
                }
            } else {
                // Base64 inválido: copia padrão
                copy($caminho_foto_padrao, $caminho_arquivo);
            }
        } else {
            // Sem foto na API: copia padrão
            copy($caminho_foto_padrao, $caminho_arquivo);
        }

        // Atualiza a URL para evitar cache
        $data['foto_url'] = $url_base_fotos . $data['id'] . '.png?v=' . time();

        $dados_profissionais[] = $data;
    } else {
        $erros[] = [
            'id_profissional' => $id,
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
}

http_response_code(200);
echo json_encode([
    'dados' => $dados_profissionais,
    'erros' => $erros
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
exit;

?>
