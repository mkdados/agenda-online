<?php

function fn_curl_request($parametros) {
    // Parâmetros obrigatórios
    $url_integracao = $parametros['url'] ?? '';
    $metodo_http = strtoupper($parametros['metodo'] ?? 'GET');
    $request_body = $parametros['body'] ?? '';
    $headers = $parametros['headers'] ?? ['Content-Type: application/json'];

    // Inicializa cURL
    $curl = curl_init();

    // Configurações da requisição
    curl_setopt_array($curl, array(
        CURLOPT_URL => $url_integracao,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => $metodo_http,
        CURLOPT_POSTFIELDS => $request_body,
        CURLOPT_HTTPHEADER => $headers,
    ));

    // Executa requisição
    $response = curl_exec($curl);
    $http_status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($curl);

    // Fecha conexão
    curl_close($curl);

    // Decodifica resposta
    $data = json_decode($response, true);

    if (empty($curl_error)) {

        return [
            'sucesso' => "S",
            'http_status' => $http_status,
            'response' => $response,
            'data' => $data
        ];
    } else {
        return [
            'sucesso' => "N",
            'http_status' => $http_status,
            'erro' => $curl_error,
            'response' => $response,
            'data' => $data
        ];
    }
}


?>