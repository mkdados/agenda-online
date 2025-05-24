function fn_autenticacao() {
  const url = 'http://localhost/agendaonline/assets/api/autenticacao.php';
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return fetch(url, options)
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro na requisição: ' + response.status);
      }
      return response.json(); // retorna o JSON da resposta
    })
    .catch(error => {
      return error;
    });
}

