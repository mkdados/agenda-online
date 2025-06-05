/*Cadastrar paciente======================================================================*/
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Coleta os dados do formulário
    const nome = document.getElementById("nomeCompleto").value.trim();
    const cpf = document.getElementById("cpf").value.trim();
    const dataNascimento = document.getElementById("dataNascimento").value.trim();
    const celular = document.getElementById("celular").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    if (senha !== confirmarSenha) {
      Swal.fire({
        icon: "warning",
        title: "Atenção",
        text: "As senhas não coincidem!",
      });
      return;
    }

    // Monta os dados a serem enviados
    const payload = {
      nome: nome,
      cpf: cpf,
      data_nascimento: dataNascimento,
      celular: celular,
      email: email,
      senha: senha,
      ativo: "S"
    };

    try {
      const response = await fetch("api/cadastrar-paciente.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Sucesso!",
          text: data.mensagem || "Acesso cadastrado com sucesso!"
        }).then(() => {
          window.location.href = "index.html"; // redireciona para login
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: data.erro || "Erro ao cadastrar acesso"
        });
      }


      //Fecha loader
      document.getElementById("loader").style.display = "none";

    } catch (error) {
      console.error("Erro:", error);
      Swal.fire({
        icon: "error",
        title: "Erro de conexão",
        text: "Não foi possível conectar ao servidor"
      });

      //Fecha loader
      document.getElementById("loader").style.display = "none";
    }
  });
});


   