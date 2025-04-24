$(document).ready(function() {
  $('#cpf').inputmask('999.999.999-99'); // Aplica a máscara de CPF
  $('#dataNascimento').inputmask('99/99/9999'); // Aplica a máscara de data de nascimento
  $('#celular').inputmask('(99) 99999-9999'); // Aplica a máscara de celular
});


// Função para fazer o login usando uma API
  document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Impede o envio padrão do formulário
    
    // Exibe o loader
    document.getElementById('loader').style.display = 'flex';

    // Obtendo os valores dos campos
    const emailCpf = document.getElementById('emailCpf').value;
    const password = document.getElementById('password').value;
    
    // Validação simples de entrada
    if (!emailCpf || !password) {
      // Usando SweetAlert2 para exibir uma mensagem de erro
      Swal.fire({
        icon: 'error',
        title: 'Campos inválidos',
        text: 'Por favor, preencha todos os campos.',
      });
      document.getElementById('loader').style.display = 'none'; // Esconde o loader se os campos não estiverem preenchidos
      return;
    }

    window.location.href = "home.html";

    // // Fazendo a requisição para a API
    // fetch('http://localhost:3000/users/1', {
    //   method: 'GET',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   }
    // })
    // .then(response => response.json())
    // .then(data => {
    //   // Esconde o loader após a resposta
    //   document.getElementById('loader').style.display = 'none';

    //   if (data.email == emailCpf) {
    //     // Exibe um alerta de sucesso usando SweetAlert2
    //     Swal.fire({
    //       icon: 'success',
    //       title: 'Login bem-sucedido',
    //       text: 'Você foi logado com sucesso.',
    //     });
    //   } else {
    //     // Exibe um alerta de erro usando SweetAlert2
    //     Swal.fire({
    //       icon: 'error',
    //       title: 'Credenciais inválidas',
    //       text: 'Tente novamente.',
    //     });
    //   }
    // })
    // .catch(error => {
    //   // Esconde o loader após erro
    //   document.getElementById('loader').style.display = 'none';
    //   // Exibe um alerta de erro usando SweetAlert2
    //   Swal.fire({
    //     icon: 'error',
    //     title: 'Erro',
    //     text: 'Ocorreu um erro. Tente novamente.',
    //   });
    // });

  });