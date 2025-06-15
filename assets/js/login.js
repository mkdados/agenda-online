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
    loader.style.display = 'none'; // esconde o loader

    if (response.ok) {  

      //Seta sessionStorage com os dados do usuário
      sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
      sessionStorage.setItem('sessao', JSON.stringify(data.sessao));
      const id_usuario = data.usuario.id;

      //Resgata o token===============
      fn_gera_token(id_usuario)
        .then(data => {
          
          sessionStorage.setItem('token', JSON.stringify({
              chave: data.token.chave,
              duracao: data.token.duracao
          }));
          window.location.href = 'home.html';

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
