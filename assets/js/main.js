document.getElementById("apiButton").addEventListener("click", function () {
  document.getElementById("response").innerText = "Carregando...";

  const filtro = "filialId eq 7 and profissionalId eq 14581 and dataInicio ge 2025-05-14 and dataFim le 2025-06-01";
  //const groupBy = "dataInicio";
  const groupBy = "";

  TokenService.getToken()
    .then(function (token) {
      const parametros = {
        url: AGENDA_DISPONIVEL.URL,
        metodo: "GET",
        filtro: filtro,
        groupBy: groupBy,
        header: {
          "Authorization": "Bearer " + token,
          "dataInicio": "2025-05-14",
          "dataFim": "2025-06-14"
        }
      };

      // Aqui você trata a Promise corretamente com .then()
      ApiService.fetchData(parametros)
        .then(function (data) {
          document.getElementById("response").innerText = JSON.stringify(data, null, 2);
          // Extrai só a parte da data (YYYY-MM-DD) de cada item
          //const datas = data.map(item => item.dataInicio.split("T")[0]);

          // Exibe o array de datas como JSON formatado
          //document.getElementById("response").innerText = JSON.stringify(datas, null, 2);
        })
        .catch(function (error) {
          document.getElementById("response").innerText = "Erro ao obter dados.";
        });
    })
    .catch(function (error) {
      document.getElementById("response").innerText = "Erro ao obter token.";
    });
});
