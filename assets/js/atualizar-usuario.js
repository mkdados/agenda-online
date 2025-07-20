function fn_atualizar_usuario(parametros) {
  const url = 'api/atualizar-usuario.php';
  const body = parametros;

  const options = {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body) // <-- Aqui o JSON é enviado no corpo
  };

  return fetch(url, options)
    .then(response => {
      return response.json(); // retorna o JSON da resposta
    })
    .catch(error => {
      return { erro: error.message };
    });
}
