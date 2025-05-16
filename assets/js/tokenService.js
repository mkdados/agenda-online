class TokenService {
  static getToken() {
    const existingToken = sessionStorage.getItem("authToken");
    const expiration = new Date(sessionStorage.getItem("authTokenDuracao"));
    const now = new Date();

    if (existingToken && now <= expiration) {
      return Promise.resolve(existingToken);
    }

    return fetch(TOKEN_ACESSO.URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "Login": TOKEN_ACESSO.LOGIN,
        "Senha": TOKEN_ACESSO.SENHA,
        "plataforma": TOKEN_ACESSO.PLATAFORMA
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
