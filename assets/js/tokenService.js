class TokenService {
  static getToken() {
    const existingToken = sessionStorage.getItem("authToken");
    const expiration = new Date(sessionStorage.getItem("authTokenDuracao"));
    const now = new Date();

    if (existingToken && now <= expiration) {
      return Promise.resolve(existingToken);
    }

    //Token de Acesso===================================
    let url_autenticacao = AUTENTICACAO.URL;    
    let token_url = "";
    let token_login = "";
    let token_senha = "";
    let token_plataforma = "";

    console.log(url_autenticacao);
    

    fetch(url_autenticacao, {
      method: 'GET'
    })
    .then(response => {
      if (!response.ok) throw new Error('Erro de autenticação');
      return response.json();
    })
    .then(data => {
      //console.log('Dados protegidos recebidos:', data);
      // console.log('Dados protegidos recebidos:', data.TOKEN_ACESSO.LOGIN);
      // console.log('Dados protegidos recebidos:', data.TOKEN_ACESSO.SENHA);
      token_url = data.AUTENTICACAO.URL;
      token_login = data.AUTENTICACAO.LOGIN;
      token_senha = data.AUTENTICACAO.SENHA;
      token_plataforma = data.TOKEN_ACESSO.PLATAFORMA;
     
    })
    .catch(error => {
      console.error('Erro ao consumir API:', error);
    });
    //===========================================


    return fetch(token_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "Login": token_login,
        "Senha": token_senha,
        "plataforma": token_plataforma
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data?.token?.chave) {
          sessionStorage.setItem("authToken", data.token.chave);
          sessionStorage.setItem("authTokenDuracao", data.token.duracao);
          return data.token.chave;
        } else {
          throw new Error("Token não encontrado.");
        }
      });
  }
}
