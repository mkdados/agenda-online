document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");
  const botaoCadastrar = document.getElementById("btnCadastrar");
  const loader = document.getElementById("loader");

  // Captura todos os inputs automaticamente
  const inputs = form.querySelectorAll("input");

  inputs.forEach(input => {
    // Remove classe de erro ao digitar
    input.addEventListener("input", () => {
      input.classList.remove("is-invalid");
    });

    // Envia o formulário ao pressionar Enter
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        form.requestSubmit();
      }
    });

    // Validação ao sair do campo
    input.addEventListener("blur", function () {
      switch (input.id) {
        case "cpf":
          toggleInvalidClass(input, validarCPF(input.value));
          break;
        case "dataNascimento":
          toggleInvalidClass(input, validarData(input.value));
          break;
        case "celular":
          toggleInvalidClass(input, validarCelular(input.value));
          break;
        case "nomeCompleto":
          toggleInvalidClass(input, validarNomeCompleto(input.value));
          break;
      }
    });
  });

  // Submit do formulário chama o botão cadastrar
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    botaoCadastrar.click();
  });

  botaoCadastrar.addEventListener("click", async function () {
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Coleta automática dos dados do formulário
    const formData = new FormData(form);
    const dados = Object.fromEntries(formData.entries());

    // Limpeza e formatação
    dados.cpf = dados.cpf.replace(/[^\d]+/g, '');
    dados.email = dados.email.toLowerCase();
    dados.ativo = "S";    
    
    // Validações
    if (!validarNomeCompleto(dados.nomeCompleto)) {
      Swal.fire({ icon: "warning", title: "Nome incompleto", text: "Digite seu nome completo (nome e sobrenome)." });
      toggleInvalidClass(form.nomeCompleto, false);
      form.nomeCompleto.focus();
      return;
    }

    if (!validarCPF(dados.cpf)) {
      Swal.fire({ icon: "warning", title: "CPF inválido", text: "Insira um CPF válido." });
      toggleInvalidClass(form.cpf, false);
      form.cpf.focus();
      return;
    }

    if (!validarData(dados.dataNascimento)) {
      Swal.fire({ icon: "warning", title: "Data de nascimento inválida", text: "Use o formato dd/mm/aaaa." });
      toggleInvalidClass(form.dataNascimento, false);
      form.dataNascimento.focus();
      return;
    }

    if (!validarCelular(dados.celular)) {
      Swal.fire({ icon: "warning", title: "Celular inválido", text: "Insira um número com DDD." });
      toggleInvalidClass(form.celular, false);
      form.celular.focus();
      return;
    }

    if (dados.senha !== dados.confirmarSenha) {
      Swal.fire({ icon: "warning", title: "Senhas diferentes", text: "As senhas não coincidem." });
      form.senha.focus();
      return;
    }

    // Função para formatar data dd/mm/aaaa → yyyy-mm-dd
    function formatarDataParaISO(data) {
      const [dia, mes, ano] = data.split('/');
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    dados.dataNascimento = formatarDataParaISO(dados.dataNascimento);
    
    delete dados.confirmarSenha; // Não enviar senha de confirmação

    // Exibe loader
    loader.style.display = "flex";

    try {
      const response = await fetch("api/cadastrar-paciente.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
      });

      let data = {};
      try {
        data = await response.json();
      } catch {}

      loader.style.display = "none";

      if (response.ok) {
        await Swal.fire({
          icon: "success",
          title: "Sucesso!",
          text: data?.mensagem || "Cadastro realizado com sucesso!"
        });
        
        window.location.href = "index.html";

      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: data?.mensagem || "Erro ao cadastrar."
        });
      }
    } catch {
      loader.style.display = "none";
      Swal.fire({
        icon: "error",
        title: "Erro de conexão",
        text: "Não foi possível conectar ao servidor."
      });
    }
  });
});
