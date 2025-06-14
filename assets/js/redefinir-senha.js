document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("resetForm");
  const senhaInput = document.getElementById("senha");
  const confirmarInput = document.getElementById("confirmarSenha");
  const botaoEnviar = document.getElementById("btnRedefinirSenha");
  const loader = document.getElementById("loader");

  if (!form || !senhaInput || !confirmarInput || !botaoEnviar || !loader) {
    console.error("Algum elemento obrigatório não foi encontrado no DOM.");
    return; // para evitar erro no script
  }

  // Remove erro visual ao digitar
  senhaInput.addEventListener("input", () => {
    senhaInput.classList.remove("is-invalid");
    confirmarInput.classList.remove("is-invalid");
  });
  confirmarInput.addEventListener("input", () => {
    senhaInput.classList.remove("is-invalid");
    confirmarInput.classList.remove("is-invalid");
  });

  // Submit manual via botão
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    botaoEnviar.click();
  });

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
      Swal.fire("Senhas não coincidem", "Confirme a senha corretamente.", "warning");
      senhaInput.classList.add("is-invalid");
      confirmarInput.classList.add("is-invalid");
      return;
    }

    // Pega token da URL (exemplo: ?token=abcdef)
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      Swal.fire("Erro", "Token de redefinição não encontrado.", "error");
      return;
    }

    loader.style.display = "flex";

    try {
      const response = await fetch("api/redefinir-senha.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token, nova_senha: senha })
      });

      const data = await response.json();
      loader.style.display = "none";

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Senha redefinida!",
          text: data.mensagem || "Sua senha foi alterada com sucesso."
        }).then(() => {
          window.location.href = "index.html"; // redireciona para login
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: data.erro || "Falha ao redefinir senha."
        });
      }
    } catch (err) {
      loader.style.display = "none";
      Swal.fire("Erro de conexão", "Não foi possível conectar ao servidor.", "error");
    }
  });
});
