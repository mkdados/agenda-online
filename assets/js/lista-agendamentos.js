async function fn_lista_agendamentos(parametros) {
  const url = 'api/lista-agendamentos.php';
  const body = parametros;

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body) // <-- Aqui o JSON é enviado no corpo
  };

  // Validar o token ======================================================
  await fn_valida_token();
  
  try {
    const response = await fetch(url, options);
    return await response.json();
  } catch (error) {
    return { erro: error.message };
  }
}
