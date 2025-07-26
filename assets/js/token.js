/*===================================================================================
  VALIDA TOKEN
/*===================================================================================*/
async function fn_valida_token() {
  const usuario = JSON.parse(sessionStorage.getItem('usuario') || '{}');
  const token = JSON.parse(sessionStorage.getItem('token') || '{}');

  if (!usuario?.id_usuario || !token?.duracao) {
    // Redireciona se não houver dados válidos
    return window.location.href = 'sessao-encerrada.html';
  }

  const id_usuario = usuario.id_usuario;
  const cpf = usuario.cpf;

  // Remover o "Z" se existir, e tratar como local
  const token_duracao = token.duracao?.replace(/Z$/, '') || '';
  const agora = new Date();
  const expiracao = new Date(token_duracao);

  // Verificar se o token está expirado
  if (agora >= expiracao) {
    try {
      const parametrosToken = { cpf, id_usuario };
      const tokenData = await fn_gera_token(parametrosToken);

      if (tokenData?.chave && tokenData?.duracao) {
        const id_organizacao = tokenData.id_organizacao;
        const chave = tokenData.chave;

        sessionStorage.setItem('token', JSON.stringify({
          id_organizacao,
          chave,
          duracao: tokenData.duracao
        }));

        //console.log("Novo token gerado.");
      } else {
        //console.warn("Token inválido ou resposta incompleta.");
      }

    } catch (error) {
      //console.error("Erro ao gerar novo token:", error);
    }
  } else {
    //console.log("Token ainda válido.");
  }
}


/*===================================================================================
  GERA TOKEN
/*===================================================================================*/
function fn_gera_token(parametros) {
  const url = 'api/token.php';
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
