
// Limpa sessionStorage ao carregar a página de login
sessionStorage.clear();

async function realizarLogin() {
const identificador = document.getElementById('emailCpf').value.trim();
const senha = document.getElementById('password').value;

try {
    const response = await fetch('api/login.php', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ identificador, senha })
    });

    const data = await response.json();

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

// Pressionar Enter no campo de senha ou e-mail
document.getElementById('loginForm').addEventListener('keydown', function(e) {
if (e.key === 'Enter') {
    e.preventDefault();
    realizarLogin();
}
});
