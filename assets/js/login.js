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
      sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
      window.location.href = 'home.html';
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Erro ao entrar',
        text: data.erro || 'Não foi possível fazer login'
      });
    }
  } catch (error) {
    loader.style.display = 'none'; // esconde o loader
    console.error('Erro na requisição:', error);
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
