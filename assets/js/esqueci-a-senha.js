document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");
  const input = document.getElementById("emailCpf");
  const botaoEnviar = document.getElementById("btnEnviar");
  const loader = document.getElementById("loader");

  // Remove erro visual ao digitar
  input.addEventListener("input", () => {
    input.classList.remove("is-invalid");
  });

  // Submit manual via botão
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    botaoEnviar.click();
  });

  // Clique no botão envia a requisição
  botaoEnviar.addEventListener("click", async function () {
    const valor = input.value.trim();

    if (!valor) {
      Swal.fire("Campo obrigatório", "Informe seu e-mail ou CPF.", "warning");
      input.classList.add("is-invalid");
      return;
    }

    const isCpf = /^\d{11}$/.test(valor.replace(/\D/g, ""));
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.toLowerCase());

    if (!isCpf && !isEmail) {
      Swal.fire("Formato inválido", "Informe um e-mail ou CPF válido.", "warning");
      input.classList.add("is-invalid");
      return;
    }

    const payload = isCpf
      ? { cpf: valor.replace(/\D/g, "") }
      : { email: valor.toLowerCase() };

    loader.style.display = "flex";

    try {
      const response = await fetch("api/esqueci-a-senha.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      loader.style.display = "none";

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Instruções enviadas!",
          html: "Verifique seu e-mail para redefinir sua senha."
        });
        input.value = "";
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: data.erro || "Falha ao enviar instruções. Tente novamente."
        });
      }
    } catch (err) {
      loader.style.display = "none";
      Swal.fire("Erro de conexão", "Não foi possível conectar ao servidor.", "error");
    }
  });
});
