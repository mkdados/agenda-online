const loader = document.getElementById('loader');

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
  var carteirinha = document.getElementById("carteirinha");

  if (tipoAtendimento === "convenio") {
    convenioDiv.style.display = "block";
    //planoDiv.style.display = "block";
    carteirinhaDiv.style.display = "block";

    // Dados do storage
    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    const token = JSON.parse(sessionStorage.getItem('token'));
    const paciente = JSON.parse(sessionStorage.getItem('paciente'));
    const id_usuario = usuario.id_usuario;
    const chave = token.chave;
    const numero_carteirinha = paciente.numero_carteirinha || '';
    const idConvenioSelecionado = paciente.id_convenio || 0;    

    loader.style.display = 'flex'; // mostra o loader

    const parametros = {
      id_usuario: id_usuario,
      token: chave,
      id_convenio: idConvenioSelecionado
    };

    // Listar convênios
    fn_lista_convenio(parametros)
      .then(data => {
        const listaConvenios = data.value;
        const selectConvenio = document.getElementById('convenioSelect');
        selectConvenio.innerHTML = '<option value="">Selecione o convênio</option>';

        if (Array.isArray(listaConvenios)) {
          listaConvenios.forEach(convenio => {
            const option = document.createElement('option');
            option.value = convenio.id;
            option.textContent = convenio.razaoSocial;
            selectConvenio.appendChild(option);

            // Seleciona o convênio do paciente, se existir
            if (convenio.id > 0 && convenio.id === idConvenioSelecionado) {
              option.selected = true;
            }

            //Seta numero da carteirinha
            if(numero_carteirinha) {
              carteirinha.value = numero_carteirinha;
            }
          });
          loader.style.display = 'none'; // esconde o loader
        } else {
          console.warn('Formato de resposta inesperado:', data);
          loader.style.display = 'none'; // esconde o loader
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
    loader.style.display = 'none'; // esconde o loader
  }
}


/*###########################################################################################
    Script para selecionar unidade
  ############################################################################################*/ 

   document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('btnGoToStep2').addEventListener('click', function () {

        // Dados do storage
        const usuario = JSON.parse(sessionStorage.getItem('usuario'));
        const token = JSON.parse(sessionStorage.getItem('token'));
        const id_usuario = usuario.id_usuario;
        const chave = token.chave;  

        loader.style.display = 'flex'; // mostra o loader

        const parametros = {
          id_usuario: id_usuario,
          token: chave
        };

        // Listar filiais
        fn_lista_filiais(parametros)
           .then(data => {
              const listaFilials = data.value;
              const selectFilial = document.getElementById('unidadeSelect');
              selectFilial.innerHTML = '<option value="">Selecione uma unidade</option>';

              if (Array.isArray(listaFilials)) {
                listaFilials.forEach(filial => {
                  const option = document.createElement('option');
                  option.value = filial.id;
                  option.textContent = filial.nomeCompleto;
                  selectFilial.appendChild(option);
                });
                loader.style.display = 'none'; // esconde o loader
              } else {
                console.warn('Formato de resposta inesperado:', data);
                loader.style.display = 'none'; // esconde o loader
              }
          })
          .catch(error => {
            console.error('Erro ao carregar filiais:', error.message);
            loader.style.display = 'none';
          }); 
        
    });
  });  

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

  /*###########################################################################################
    Set select2
  ############################################################################################*/ 
    $(document).ready(function() {
      $('.select2').select2({
        minimumResultsForSearch: 0, // sempre mostra a busca
        width: '100%',              // usa largura do elemento original
        allowClear: true
      });
    });
