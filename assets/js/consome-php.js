let url_autenticacao = AUTENTICACAO.URL;

fetch(url_autenticacao, {
  method: 'GET'
})
.then(response => {
  if (!response.ok) throw new Error('Erro de autenticação');
  return response.json();
})
.then(data => {
  console.log('Dados protegidos recebidos:', data);
  // console.log('Dados protegidos recebidos:', data.TOKEN_ACESSO.LOGIN);
  // console.log('Dados protegidos recebidos:', data.TOKEN_ACESSO.SENHA);
})
.catch(error => {
  console.error('Erro ao consumir API:', error);
});
