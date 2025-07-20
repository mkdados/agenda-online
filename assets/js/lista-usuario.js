function fn_lista_usuario(parametros) {
  const url = 'api/lista-usuario.php';
  const body = parametros;

  const options = {
    method: 'POST',
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
