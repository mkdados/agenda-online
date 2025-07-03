
  /*###########################################################################################
     Função para alternar o menu lateral
  ############################################################################################*/   
  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const icon = document.querySelector('#user-section button i');
    sidebar.classList.toggle('collapsed');
    icon.classList.toggle('bi-chevron-left');
    icon.classList.toggle('bi-chevron-right');
  }

  function toggleMobileSidebar(forceClose = false) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const content = document.getElementById('content');

    const isVisible = sidebar.classList.contains('mobile-show');

    if (forceClose || isVisible) {
      sidebar.classList.remove('mobile-show');
      overlay.style.display = 'none';
      content.classList.remove('mobile-shifted');
    } else {
      sidebar.classList.add('mobile-show');
      overlay.style.display = 'block';
      content.classList.add('mobile-shifted');
    }
  }


  // Fechar o menu ao clicar no overlay
  document.getElementById('overlay').addEventListener('click', function() {
    toggleMobileSidebar(); // Fecha o menu e o overlay
  });

  // Adicionar evento de clique para os links do menu lateral
  document.querySelectorAll('#sidebar .nav-link').forEach(link => {
    link.addEventListener('click', function () {
      document.querySelectorAll('#sidebar .nav-link').forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });


  /*###########################################################################################
     Setar dados do usuário logado
  ############################################################################################*/ 
  
  // Dados do storage
  const usuario = JSON.parse(sessionStorage.getItem('usuario'));
  const token = JSON.parse(sessionStorage.getItem('token'));
  const id_usuario = usuario.id_usuario;
  const chave = token.chave;  
  const paciente = JSON.parse(sessionStorage.getItem("paciente"));
  const id_paciente = paciente.id_paciente;

  if (usuario) {
    // Atualiza nome e e-mail no menu lateral
    document.querySelector('#user-section .name').textContent = usuario.nome;
    document.querySelector('#user-section .email').textContent = usuario.email;

    // Atualiza saudação principal
    const homeInfo = document.querySelector('#home-info');
    if (usuario && usuario.nome && homeInfo) {
      homeInfo.innerHTML = `Bem-vindo(a), ${usuario.nome}!`;
    }    

    // Atualiza avatar com as iniciais do nome (ex: MV)
    const avatar = document.querySelector('.avatar-circle');
    if (avatar && usuario.nome) {
      const iniciais = usuario.nome.split(' ').map(p => p.charAt(0)).slice(0, 2).join('').toUpperCase();
      avatar.textContent = iniciais;
    }
  } else {
    // Se não houver login, redireciona para login
    window.location.href = 'index.html';
  }


  /*###########################################################################################
     Formata a data e hora atual
  ############################################################################################*/ 
  function formatarDataHora() {
    const data = new Date();

    const diasSemana = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

    const diaSemana = diasSemana[data.getDay()];
    const dia = data.getDate();
    const mes = meses[data.getMonth()];
    const ano = data.getFullYear();

    let horas = data.getHours();
    let minutos = data.getMinutes();

    if (horas < 10) horas = '0' + horas;
    if (minutos < 10) minutos = '0' + minutos;

    return `<i class="bi bi-calendar me-2"></i> ${diaSemana}, ${dia} de ${mes} de ${ano} <i class="bi bi-clock mx-2"></i> ${horas}:${minutos}`;
  }

  const elementoDataHora = document.getElementById('data-hora');
  elementoDataHora.innerHTML = formatarDataHora();

  setInterval(() => {
    elementoDataHora.innerHTML = formatarDataHora();
  }, 60000);



           