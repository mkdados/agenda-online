<?php

function fn_log_integracao($parametros) {
    global $conn; // Garante acesso à conexão com o banco de dados

    // Grava log
    try {
        $ip_cliente = fn_get_ip();

        // Extrai os parâmetros do array associativo
        $id_cliente             = $parametros['id_cliente'] ?? null;
        $id_integracao          = $parametros['id_integracao'] ?? null;
        $id_integracao_endpoint = $parametros['id_integracao_endpoint'] ?? null;
        $id_paciente            = $parametros['id_paciente'] ?? null;
        $url_integracao         = $parametros['url_integracao'] ?? null;
        $metodo_http            = $parametros['metodo_http'] ?? null;
        $request_body           = $parametros['request_body'] ?? null;
        $response               = $parametros['response'] ?? null;
        $http_status            = $parametros['http_status'] ?? null;
        $sucesso                = $parametros['sucesso'] ?? null;

        $log_stmt = $conn->prepare("
            INSERT INTO tbl_integracao_log 
            (id_cliente, id_integracao, id_integracao_endpoint, id_paciente, ip, url_utilizada, metodo_http, request, response, status_http, sucesso)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $log_stmt->bind_param(
            "iiissssssss",
            $id_cliente,
            $id_integracao,
            $id_integracao_endpoint,
            $id_paciente,
            $ip_cliente,
            $url_integracao,
            $metodo_http,
            $request_body,
            $response,
            $http_status,
            $sucesso
        );

        $log_stmt->execute();
        $log_stmt->close();
    } catch (Exception $e) {
        error_log("Erro ao gravar log: " . $e->getMessage());
    }
}

?>