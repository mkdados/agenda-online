<?php

function fn_log_integracao($parametros) {
    global $conn;

    try {
        if (!$conn) {
            throw new Exception("Sem conexão com o banco de dados.");
        }

        $ip_cliente = fn_get_ip();

        $id_cliente             = $parametros['id_cliente'] ?? null;
        $id_integracao          = $parametros['id_integracao'] ?? null;
        $id_integracao_endpoint = $parametros['id_integracao_endpoint'] ?? null;
        $id_usuario             = $parametros['id_usuario'] ?? null;
        $url_integracao         = $parametros['url_integracao'] ?? null;
        $metodo_http            = $parametros['metodo_http'] ?? null;
        $request_body           = $parametros['request_body'] ?? null;
        $response               = $parametros['response'] ?? null;
        $http_status            = $parametros['http_status'] ?? null;
        $sucesso                = $parametros['sucesso'] ?? 'N';

        // Prepara o statement
        $stmt = $conn->prepare("
            INSERT INTO tbl_integracao_log 
            (id_cliente, id_integracao, id_integracao_endpoint, id_usuario, ip, url_utilizada, metodo_http, request, response, status_http, sucesso)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        if (!$stmt) {
            throw new Exception("Erro no prepare: " . $conn->error);
        }

        $stmt->bind_param(
            "iiissssssss",
            $id_cliente,
            $id_integracao,
            $id_integracao_endpoint,
            $id_usuario,
            $ip_cliente,
            $url_integracao,
            $metodo_http,
            $request_body,
            $response,
            $http_status,
            $sucesso
        );

        if (!$stmt->execute()) {
            throw new Exception("Erro ao executar INSERT: " . $stmt->error);
        }

        $stmt->close();
    } catch (Exception $e) {
        //echo "Erro ao gravar log: " . $e->getMessage(); // REMOVA EM PRODUÇÃO
        error_log("Erro ao gravar log: " . $e->getMessage());
    }
}

