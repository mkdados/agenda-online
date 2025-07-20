<?php

// Includes
include_once '../../../config/config.php';
include_once 'funcoes.php';
include_once 'init.php';

// Permitir apenas PATCH
if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método HTTP não permitido, use PATCH']);
    exit;
}

// Lê dados brutos e decodifica JSON
$input = json_decode(file_get_contents('php://input'), true);

// Verifica ID
$id_usuario = isset($input['id_usuario']) ? intval($input['id_usuario']) : null;
if (!$id_usuario) {
    http_response_code(400);
    echo json_encode(['erro' => 'id_usuario é obrigatório']);
    exit;
}

// Verifica se o usuario existe
$stmt = $conn->prepare("SELECT id FROM tbl_usuario WHERE id = ?");
$stmt->bind_param("i", $id_usuario);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['erro' => 'Usuário não encontrado']);
    exit;
}
$stmt->close();

// Campos que podem ser atualizados
$id_cliente = $_ENV['ID_CLIENTE'] ?? null;
$atualizar_senha = isset($input['atualizar_senha']) ? $input['atualizar_senha'] : "N";
$nova_senha = isset($input['nova_senha']) ? $input['nova_senha'] : null;
$campos = [];

if($atualizar_senha=="S"){
    $campos = [
        'senha' => isset($input['senha']) ? $input['senha'] : null
    ];
}else{
    $campos = [
        'nome' => isset($input['nome']) ? trim($input['nome']) : null,
        'data_nascimento' => isset($input['data_nascimento']) ? $input['data_nascimento'] : null,
        'celular' => isset($input['celular']) ? trim($input['celular']) : null,
        'email' => isset($input['email']) ? trim($input['email']) : null
    ];

    // Trata os campos
    $campos["nome"] = strtoupper(trim($campos['nome'] ?? ''));
    $campos["data_nascimento"] = $campos['data_nascimento'] ?? null;
    $campos["celular"] = preg_replace('/\D/', '', trim($campos['celular'] ?? ''));
    $campos["email"] = strtolower(trim($campos['email'] ?? ''));
}

//Validar se é nova senha=================================================================
if($atualizar_senha=="S"){

    if (strlen($nova_senha) < 8) {
        http_response_code(400);
        $response = ['erro' => 'A senha deve conter no mínimo 8 caracteres'];
        //gravarLogIntegracao($conn, $id_cliente, null, $input_log, $response, 400, false);
        echo json_encode($response);
        exit;
    }
    
}else{
    
    // Validação de obrigatórios
    if (!$id_cliente || !$campos["nome"] || !$campos["celular"] || !$campos["email"]) {
        http_response_code(400);
        $response = ['erro' => 'Campos obrigatórios ausentes'];
        //gravarLogIntegracao($conn, $id_cliente, null, $input_log, $response, 400, false);
        echo json_encode($response);
        exit;
    }

    //Validar nome
    if (!validarNome($campos["nome"])) {
        http_response_code(400);
        $response = ['erro' => 'Informe nome e sobrenome válidos'];
        //gravarLogIntegracao($conn, $id_cliente, null, $input_log, $response, 400, false);
        echo json_encode($response);
        exit;
    }

    //Validar data de nascimento
    if ($campos["data_nascimento"] && !validarDataNascimento($campos["data_nascimento"])) {
        http_response_code(400);
        $response = ['erro' => 'Data de nascimento inválida'];
        //gravarLogIntegracao($conn, $id_cliente, null, $input_log, $response, 400, false);
        echo json_encode($response);
        exit;
    }

    if ($campos["celular"] && !validarCelular($campos["celular"])) {
        http_response_code(400);
        $response = ['erro' => 'Celular inválido'];
        //gravarLogIntegracao($conn, $id_cliente, null, $input_log, $response, 400, false);
        echo json_encode($response);
        exit;
    }

    // Verifica duplicidade email (se informado)
    if (!empty($campos["email"])) {
        $verifica_email_stmt = $conn->prepare("SELECT id FROM tbl_usuario WHERE email = ? and id != ?");
        $verifica_email_stmt->bind_param("si", $campos["email"], $id_usuario);
        $verifica_email_stmt->execute();
        $result_email = $verifica_email_stmt->get_result();
        if ($result_email->num_rows > 0) {
            http_response_code(409);
            $response = ['erro' => 'E-mail já cadastrado'];
            //gravarLogIntegracao($conn, $id_cliente, null, $input_log, $response, 409, false);
            echo json_encode($response);
            exit;
        }
        $verifica_email_stmt->close();
    }
}

// Remove campos nulos
$campos_filtrados = array_filter($campos, function ($v) {
    return !is_null($v);
});

// Nada para atualizar?
if (empty($campos_filtrados)) {
    http_response_code(400);
    echo json_encode(['erro' => 'Nenhum campo para atualizar']);
    exit;
}

// Se for atualizar a senha, é obrigatório validar a senha atual
if($atualizar_senha=="S"){
    if (empty($campos['senha'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'Senha atual é obrigatória para atualizar a senha']);
        exit;
    }

    // Busca a senha atual do banco
    $stmt = $conn->prepare("SELECT senha FROM tbl_usuario WHERE id = ?");
    $stmt->bind_param("i", $id_usuario);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['erro' => 'Usuário não encontrado']);
        exit;
    }

    $usuario = $res->fetch_assoc();
    $senha_hash = $usuario['senha'];

    // Verifica se a senha atual confere
    if (!password_verify($campos['senha'], $senha_hash)) {
        http_response_code(401);
        echo json_encode(['erro' => 'Senha atual incorreta']);
        exit;
    }

    $stmt->close();
}

// Prepara campos dinamicamente
$set_clause = [];
$param_types = '';
$param_values = [];

foreach ($campos_filtrados as $campo => $valor) {
    if($atualizar_senha=="S") {
        $valor = password_hash($nova_senha, PASSWORD_BCRYPT);
    }
    $set_clause[] = "$campo = ?";
    $param_types .= 's';
    $param_values[] = $valor;
}

// Adiciona o ID ao final
$param_types .= 'i';
$param_values[] = $id_usuario;

$query = "UPDATE tbl_usuario SET " . implode(', ', $set_clause) . " WHERE id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param($param_types, ...$param_values);

// Executa e responde
try {
    $stmt->execute();
    http_response_code(200);
    echo json_encode([
        'mensagem' => 'Usuário atualizado com sucesso',
        'id_usuario' => $id_usuario
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro ao atualizar usuário',
        'detalhe' => $e->getMessage()
    ]);
}
