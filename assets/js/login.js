// Limpa sessionStorage ao carregar a página de login
sessionStorage.clear();

const loader = document.getElementById('loader');

async function realizarLogin() {
  const identificador = document.getElementById('emailCpf').value.trim();
  const senha = document.getElementById('password').value;

  loader.style.display = 'flex'; // mostra o loader

  try {
    const response = await fetch('api/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificador, senha })
    });

    const data = await response.json();

    if (response.ok) {  

      //Seta sessionStorage com os dados do usuário
      sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
      sessionStorage.setItem('sessao', JSON.stringify(data.sessao));
      const id_usuario = data.usuario.id_usuario;
      const cpf = data.usuario.cpf;

      const parametrosToken = {
        identificador: identificador,
        id_usuario: id_usuario       
      };
      
      //Resgata o token===============
      fn_gera_token(parametrosToken)
        .then(data => {  
          
          const id_organizacao = data.id_organizacao;
          const chave = data.chave;
          const duracao = data.duracao;          

          //Grava o token no sessionStorage
          sessionStorage.setItem('token', JSON.stringify({
              id_organizacao: id_organizacao,
              chave: chave,
              duracao: duracao
          }));   

          const parametros = {
            id_usuario: id_usuario,
            token: chave,
            cpf: cpf
          };

          //Pega dados do paciente
          fn_lista_pacientes(parametros)
            .then(data => {
              const listaPacientes = data.value;

              listaPacientes.forEach(paciente => {
                  
                  const dados_paciente = {
                    id_paciente: paciente?.id,
                    id_convenio: paciente?.convenio?.id,
                    numero_carteirinha: paciente?.convenio?.numCarteira
                  };

                  // Verifica se o paciente tem dados válidos
                  const data_paciente = Object.fromEntries(
                    Object.entries(dados_paciente).filter(([_, v]) => v != null && v !== '')
                  );

                  //Grava o paciente no sessionStorage
                  sessionStorage.setItem('paciente', JSON.stringify(data_paciente));

              });               

              //Redireciona para a página home
              window.location.href = 'home.html';   
            })
            .catch(error => {

              const dados_paciente = {
                    id_paciente: null,
                    id_convenio: null,
                    numero_carteirinha: null
                  };

              // Verifica se o paciente tem dados válidos
              const data_paciente = Object.fromEntries(
                Object.entries(dados_paciente).filter(([_, v]) => v != null && v !== '')
              );

              //Grava o paciente no sessionStorage
              sessionStorage.setItem('paciente', JSON.stringify(data_paciente));

              //Redireciona para a página home
              window.location.href = 'home.html';

            });
               

        })
        .catch(error => {
          loader.style.display = 'none'; // esconde o loader
          Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Erro inesperado. Tente novamente mais tarde.'
          });
        });     
    
    } else {
      loader.style.display = 'none'; // esconde o loader
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        html: data?.erro
      });
    }
  } catch (error) {
    loader.style.display = 'none'; // esconde o loader
    Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: 'Erro inesperado. Tente novamente mais tarde.'
    });
  }
}

// Clique no botão
document.getElementById('btnLogin').addEventListener('click', realizarLogin);

// Pressionar Enter no formulário
document.getElementById('loginForm').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    realizarLogin();
  }
});
