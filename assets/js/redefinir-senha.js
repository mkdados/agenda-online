document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("resetForm");
  const senhaInput = document.getElementById("senha");
  const confirmarInput = document.getElementById("confirmarSenha");
  const botaoEnviar = document.getElementById("btnRedefinirSenha");
  const loader = document.getElementById("loader");

  // 📌 Verifica se o token está presente na URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) {
    Swal.fire({
      icon: "error",
      title: "Link inválido",
      text: "Token de redefinição não encontrado. Verifique o link enviado por e-mail.",
      confirmButtonText: "Voltar ao login"
    }).then(() => {
      window.location.href = "index.html";
    });
    return;
  }

  // 🧼 Remove erro visual ao digitar
  senhaInput.addEventListener("input", () => {
    senhaInput.classList.remove("is-invalid");
    confirmarInput.classList.remove("is-invalid");
  });
  confirmarInput.addEventListener("input", () => {
    senhaInput.classList.remove("is-invalid");
    confirmarInput.classList.remove("is-invalid");
  });

  // 📨 Submit manual via botão
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    botaoEnviar.click();
  });

  // 🚀 Clique no botão envia a requisição
  botaoEnviar.addEventListener("click", async function () {
    const senha = senhaInput.value.trim();
    const confirmar = confirmarInput.value.trim();

    if (!senha || !confirmar) {
      Swal.fire("Campo obrigatório", "Preencha ambos os campos de senha.", "warning");
      if (!senha) senhaInput.classList.add("is-invalid");
      if (!confirmar) confirmarInput.classList.add("is-invalid");
      return;
    }

    if (senha.length < 8) {
      Swal.fire("Senha curta", "A senha deve ter no mínimo 8 caracteres.", "warning");
      senhaInput.classList.add("is-invalid");
      return;
    }

    if (senha !== confirmar) {
      Swal.fire("Senhas diferentes", "A confirmação de senha não corresponde.", "warning");
      senhaInput.classList.add("is-invalid");
      confirmarInput.classList.add("is-invalid");
      return;
    }

    loader.style.display = "flex";

    try {
      const response = await fetch("api/redefinir-senha.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          nova_senha: senha
        })
      });

      const data = await response.json();
      loader.style.display = "none";

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Senha redefinida!",
          text: data.mensagem || "Sua senha foi alterada com sucesso."
        }).then(() => {
          window.location.href = "index.html";
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: data.erro || "Falha ao redefinir senha. Tente novamente."
        });
      }
    } catch (err) {
      loader.style.display = "none";
      Swal.fire("Erro de conexão", "Não foi possível conectar ao servidor.", "error");
    }
  });
});
