/*###########################################################################################
    Script para alternar o menu lateral
  ############################################################################################*/ 
  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const icon = document.querySelector('#user-section button i');
    sidebar.classList.toggle('collapsed');
    icon.classList.toggle('bi-chevron-left');
    icon.classList.toggle('bi-chevron-right');
  }

  function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const content = document.getElementById('content');

    sidebar.classList.toggle('mobile-show'); // Alterna a visibilidade do menu
    overlay.style.display = sidebar.classList.contains('mobile-show') ? 'block' : 'none'; // Exibe a sobreposição
    content.classList.toggle('mobile-shifted', sidebar.classList.contains('mobile-show')); // Move o conteúdo
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
    Script para alternar entre as etapas
  ############################################################################################*/ 
  function goToStep(step) {
    // Alterna o conteúdo das etapas
    document.getElementById('step1').style.display = (step === 1) ? 'block' : 'none';
    document.getElementById('step2').style.display = (step === 2) ? 'block' : 'none';
    document.getElementById('step3').style.display = (step === 3) ? 'block' : 'none';

    // Atualiza os estilos do indicador
    document.getElementById('indicator-step-1').classList.toggle('active', step === 1);
    document.getElementById('indicator-step-2').classList.toggle('active', step === 2);
    document.getElementById('indicator-step-3').classList.toggle('active', step === 3);
  }

  // Inicializa o indicador com a primeira etapa ativa
  document.addEventListener("DOMContentLoaded", function() {
    goToStep(1);
  });

/*###########################################################################################
    Script para selecionar data
  ############################################################################################*/ 
  document.querySelectorAll('.data-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.data-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      let medicoSelecionado = document.getElementById('medicoSelect').value;

      if(medicoSelecionado == "1"){
        document.getElementById('horarioDiv1').style.display = "block";
        document.getElementById('horarioDiv2').style.display = "none";
      }
      else if(medicoSelecionado == "2"){
        document.getElementById('horarioDiv1').style.display = "none";
        document.getElementById('horarioDiv2').style.display = "block";
      }
      else{
        document.getElementById('horarioDiv1').style.display = "block";
        document.getElementById('horarioDiv2').style.display = "block";
      }
    });
  });

/*###########################################################################################
    Script para selecionar horário
  ############################################################################################*/ 
  document.querySelectorAll('.horario-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.horario-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

/*###########################################################################################
    Script para selecionar tipo de atendimento
############################################################################################*/ 
function selecionaTipoAtendimento() {
  var tipoAtendimento = document.querySelector('input[name="tipoAtendimento"]:checked').value;
  var convenioDiv = document.getElementById("convenioDiv");
  var planoDiv = document.getElementById("planoDiv");
  var carteirinhaDiv = document.getElementById("carteirinhaDiv");

  if (tipoAtendimento === "convenio") {
    convenioDiv.style.display = "block";
    planoDiv.style.display = "block";
    carteirinhaDiv.style.display = "block";

    // Listar convênios
    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    const token = JSON.parse(sessionStorage.getItem('token'));
    const id_paciente = usuario.id;
    const chave = token.chave;

    fn_get_convenio(id_paciente, chave)
      .then(data => {
        const listaConvenios = data.value; // <-- Corrigido aqui (era data.value)

        const selectConvenio = document.getElementById('convenioSelect');
        selectConvenio.innerHTML = '<option value="">Selecione um convênio</option>';

        if (Array.isArray(listaConvenios)) {
          // Ordena os convênios por razão social (case insensitive)
          listaConvenios.sort((a, b) => {
            return a.razaoSocial.localeCompare(b.razaoSocial, 'pt-BR', { sensitivity: 'base' });
          });

          listaConvenios.forEach(convenio => {
            const option = document.createElement('option');
            option.value = convenio.id;
            option.textContent = convenio.razaoSocial;
            selectConvenio.appendChild(option);
          });
        } else {
          console.warn('Formato de resposta inesperado:', data);
        }
      })
      .catch(error => {
        console.error('Erro ao carregar convênios:', error.message);
        loader.style.display = 'none';
      });

  } else {
    convenioDiv.style.display = "none";
    planoDiv.style.display = "none";
    carteirinhaDiv.style.display = "none";
  }
}


/*###########################################################################################
    Script para selecionar unidade
  ############################################################################################*/ 
  document.getElementById('unidadeSelect').addEventListener('change', function () {
    let proximaDataDiv = document.getElementById('proximaDataDisponivelDiv');
    if (this.value) {
      proximaDataDiv.style.display = "block";
    } else {
      proximaDataDiv.style.display = "none";
    }
  });

/*###########################################################################################
    Script para selecionar medico
  ############################################################################################*/ 
  document.getElementById('medicoSelect').addEventListener('change', function () {
    let horarioDiv1 = document.getElementById('horarioDiv1');
    let horarioDiv2 = document.getElementById('horarioDiv2');

    if (this.value == "1") {
      horarioDiv1.style.display = "block";
      horarioDiv2.style.display = "none";
    } 
    else if (this.value == "2") {
      horarioDiv2.style.display = "block";
      horarioDiv1.style.display = "none";
    }
    else {
      horarioDiv1.style.display = "block";
      horarioDiv2.style.display = "block";
    }
  });


 /*###########################################################################################
    JavaScript para rolagem proxima data
  ############################################################################################*/ 
  const dataScroll = document.getElementById('dataScroll');
  document.getElementById('scrollLeft').addEventListener('click', () => {
    dataScroll.scrollBy({ left: -200, behavior: 'smooth' });
  });
  document.getElementById('scrollRight').addEventListener('click', () => {
    dataScroll.scrollBy({ left: 200, behavior: 'smooth' });
  });
