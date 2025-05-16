class ApiService {
  static fetchData(parametros) {
    if (!parametros || !parametros.url || !parametros.filtro) {
      throw new Error("Parâmetros obrigatórios ausentes: 'url' e 'filtro' são necessários.");
    }

    // Construção da URL com o filtro e groupBy, se fornecido
    let url = `${parametros.url}?$apply=filter(${parametros.filtro})`;

    if (parametros.groupBy) {
      url += `/groupby((${parametros.groupBy}))`;
    }

    return fetch(url, {
      method: parametros.metodo || "GET", // valor padrão para método
      headers: parametros.header || {}    // valor padrão para headers
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        return response.json();
      })
      .catch(error => {
        console.error("Erro na chamada da API:", error);
        throw error; // Propaga o erro para que a função que chamou possa lidar com ele
      });
  }
}
