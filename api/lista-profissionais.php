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

// Valida id_profissional (aceita string "1,2,3" ou array [1,2,3])
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

// Diretório das fotos - ajuste para seu caminho local
$diretorio_fotos = '../assets/images/medicos/';
$url_base_fotos = '../assets/images/medicos/';

// Garante que o diretório existe
if (!file_exists($diretorio_fotos)) {
    mkdir($diretorio_fotos, 0755, true);
}

// Caminho da imagem padrão
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

// Separamos os ids para consultar na API (só os que não têm foto salva)
$ids_para_consultar = [];
$ids_ja_existentes = [];

foreach ($ids_profissionais as $id) {
    $caminho_foto = $diretorio_fotos . $id . '.png';
    if (file_exists($caminho_foto)) {
        // Foto já existe: retorna info básica
        $dados_profissionais[] = [
            'id' => $id,
            'foto_url' => $url_base_fotos . $id . '.png'
        ];
        $ids_ja_existentes[] = $id;
    } else {
        // Foto não existe, vamos buscar na API
        $ids_para_consultar[] = $id;
    }
}

// Agora busca só os profissionais que precisam
foreach ($ids_para_consultar as $id) {
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
        // Salva imagem da foto, se existir e diferente
        if (!empty($data['foto'])) {
            $foto_base64 = $data['foto'];
            $foto_decodificada = base64_decode($foto_base64);

            if ($foto_decodificada !== false) {
                $caminho_arquivo = $diretorio_fotos . $data['id'] . '.png';

                if (file_exists($caminho_arquivo)) {
                    $conteudo_atual = file_get_contents($caminho_arquivo);

                    // Só atualiza se for diferente
                    if ($conteudo_atual !== $foto_decodificada) {
                        file_put_contents($caminho_arquivo, $foto_decodificada);
                    }
                } else {
                    // Arquivo não existe, grava pela primeira vez
                    file_put_contents($caminho_arquivo, $foto_decodificada);
                }

                $data['foto_url'] = $url_base_fotos . $data['id'] . '.png';
            } else {
                // Base64 inválido — copia imagem padrão
                $caminho_arquivo = $diretorio_fotos . $data['id'] . '.png';
                copy($caminho_foto_padrao, $caminho_arquivo);
                $data['foto_url'] = $url_base_fotos . $data['id'] . '.png';
            }
        } else {
            // Foto não existe na API — grava imagem padrão
            $caminho_arquivo = $diretorio_fotos . $data['id'] . '.png';
            copy($caminho_foto_padrao, $caminho_arquivo);
            $data['foto_url'] = $url_base_fotos . $data['id'] . '.png';
        }

        $dados_profissionais[] = $data;
    } else {
        $erros[] = [
            'id_profissional' => $id,
            'erro' => $erro,
            'http_status' => $http_status
        ];
    }

    // Grava log
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
