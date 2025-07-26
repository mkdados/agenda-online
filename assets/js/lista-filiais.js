async function fn_lista_filiais(parametros) {
  const url = 'api/lista-filiais.php';
  const body = parametros;
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };

  // Validar o token ======================================================
  await fn_valida_token();
  
  // Enviar a requisição ======================================================
  try {
    const response = await fetch(url, options);
    return await response.json();
  } catch (error) {
    return { erro: error.message };
  }
}
