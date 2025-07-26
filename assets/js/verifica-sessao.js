  (function verificarSessao() {
  const usuario = sessionStorage.getItem('usuario');
  const sessao = sessionStorage.getItem('sessao');
  const token = sessionStorage.getItem('token');

  // Se qualquer item essencial da sessão não existir, redireciona
  if (!usuario || !sessao || !token) {
    window.location.href = 'sessao-encerrada.html'; 
  }
})();