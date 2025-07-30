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
$id_organizacao = isset($input['id_organizacao']) ? intval($input['id_organizacao']) : null;
$token = isset($input['token']) ? $input['token'] : null;
$id_filial = isset($input['id_filial']) ? intval($input['id_filial']) : null;
$id_agenda_config = isset($input['id_agenda_config']) ? $input['id_agenda_config'] : null;
$id_profissional = isset($input['id_profissional']) ? $input['id_profissional'] : null;
$qtd_dias    = 30;
$data_atual  = date("Y-m-d");
$hora_atual  = date('H');
$minuto_atual  = date('i');
$dia_semana    = date('w'); 
$data_atual_limite = "";
$evento      = isset($input['evento']) ? $input['evento'] : "";
$data_inicio = isset($input['data_inicio']) ?  $input['data_inicio'] : $data_atual;
$data_fim    = isset($input['data_fim']) ? $input['data_fim'] : date("Y-m-d", strtotime($data_inicio . " +$qtd_dias days"));
$turno       = isset($input['turno']) ? $input['turno'] : "";
$select      = isset($input['select']) ? $input['select'] : '';
$expand      = isset($input['expand']) ? $input['expand'] : '';
$orderby     = isset($input['orderby']) ? $input['orderby'] : '';

//Tratamento se é sexta feira ou final de semana
if($evento=="carrega_datas"){
    if ($dia_semana==5) { //Sexta
        $data_inicio = date("Y-m-d", strtotime($data_inicio . " +3 days"));
        $data_fim  = date("Y-m-d", strtotime($data_fim . " +3 days"));
        $data_atual_limite = date("Y-m-d", strtotime($data_atual . " +3 days"));
    }
    elseif ($dia_semana==6) { //Sábado
        $data_inicio = date("Y-m-d", strtotime($data_inicio . " +3 days"));
        $data_fim  = date("Y-m-d", strtotime($data_fim . " +3 days"));
        $data_atual_limite = date("Y-m-d", strtotime($data_atual . " +3 days"));
    }
    elseif ($dia_semana==0) { //Domingo
        $data_inicio = date("Y-m-d", strtotime($data_inicio . " +2 days"));
        $data_fim  = date("Y-m-d", strtotime($data_fim . " +2 days"));
        $data_atual_limite = date("Y-m-d", strtotime($data_atual . " +2 days"));
    }
    else{
        $data_inicio = date("Y-m-d", strtotime($data_inicio . " +1 days"));
        $data_fim  = date("Y-m-d", strtotime($data_fim . " +1 days"));
        $data_atual_limite = date("Y-m-d", strtotime($data_atual . " +1 days"));
    }
}

//Trata datas selecionadas======================================================
if($evento=="menosDatas"){

    $data_inicio_anterior = date("Y-m-d", strtotime($data_inicio . " -$qtd_dias days"));

    //Decrementa a data de início se for maior que a data atual limite
    if ($data_inicio_anterior >= $data_atual) {
        $qtd_dias += 1;
        $data_inicio = date("Y-m-d", strtotime($data_inicio . " -$qtd_dias days"));
        $qtd_dias -= 1;
        $data_fim    = date("Y-m-d", strtotime($data_inicio . " +$qtd_dias days"));
    }else{
        $data_inicio = $data_inicio;
        $data_fim    = date("Y-m-d", strtotime($data_inicio . " +$qtd_dias days"));
    }
}
elseif($evento=="maisDatas"){        
    $data_inicio = date("Y-m-d", strtotime($data_inicio . " +1 days"));
    $data_fim = date("Y-m-d", strtotime($data_fim . " +1 days"));
}

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

// Busca dados da integração
$nome_endpoint = 'LISTAR_AGENDADAMENTOS';

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
    echo json_encode(["erro" => "Integração 'AUTENTICACAO' não encontrada"]);
    exit;
}

$row = $result->fetch_assoc();
$id_integracao          = $row["id_integracao"];
$id_integracao_endpoint = $row["id_integracao_endpoint"];
$url_integracao         = $row["url"].$row["rota"];
$metodo_http            = $row["metodo_http"];
$parametros             = json_decode($row["parametros"], true) ?? [];
$request_body           = json_encode([]);
$params = [ 
    '$filter'  => "profissionalId gt 0 and agendaConfig/online eq 'S'"
];

//Select==============================================
if($select!=""){
    $params['$select'] = $select;
}

//Expand==============================================
if($expand!=""){
    $params['$expand'] = $expand;
}

//Orderby==============================================
if($orderby!=""){
    $params['$orderby'] = $orderby;
}

//Filtro de pesquisa==============================================
$filtro = "";

if($id_filial>0){
    //$filtro .= "and filialId eq $id_filial";
    $filtro .= "and agendaConfig/filialId eq $id_filial";
} 
if($id_agenda_config!=""){
    //$filtro .= "and agendaConfigId eq $id_agenda_config";
    $filtro .= "and agendaConfigId in ($id_agenda_config)";
} 
if($id_profissional!=""){
    $filtro .= "and profissionalId in ($id_profissional)";
} 
if($turno!=""){
    if($turno=="manha"){
        $filtro .= "and horaInicio lt duration'PT13H'";
    }
    elseif($turno=="tarde"){
        $filtro .= "and horaInicio ge duration'PT13H'";
    }    
}
if(isset($input['data_inicio']) and $input['data_inicio']==$data_atual){
    $filtro .= "and (horaInicio gt duration'PT{$hora_atual}H{$minuto_atual}M')";
}


//Fixar agenda LUIZ GUILHERME MARTINS CASTRO
// if($id_organizacao==2911){
//     $filtro .= "and (profissionalId eq 24014 or profissionalId eq 20857 or profissionalId eq 20856)";
// }

$params['$filter'] .= $filtro;

// Constrói a query string com URL encoding apropriado
$queryString = http_build_query($params);

// Concatena URL com query string
$url_integracao  = $url_integracao . '?' . $queryString;

// Inicializa cURL
$curl_result = fn_curl_request([
    'url' => $url_integracao,
    'metodo' => $metodo_http,
    'body' => $request_body,
    'headers' => [
        "datainicio: $data_inicio",
        "dataFim: $data_fim",
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
