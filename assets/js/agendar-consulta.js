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
document.getElementById('datasAgendamento').addEventListener('click', function (e) {
  if (e.target.closest('.data-btn')) {
    const idFilialSelecionada = document.getElementById('unidadeSelect').value;
    const idProfissionalSelecionado = document.getElementById('medicoSelect').value;
    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    const token = JSON.parse(sessionStorage.getItem('token'));
    const id_usuario = usuario.id_usuario;
    const chave = token.chave;

    const btn = e.target.closest('.data-btn');
    document.querySelectorAll('.data-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    const dataSelecionada = btn.getAttribute('data-data-agenda');
    const dataSelecionadaFormatada = btn.getAttribute('data-data-agenda-formatada');

    document.getElementById("agendasMedicos").innerHTML = "";
    loader.style.display = 'flex';

    const parametrosAgendamentos = {
      id_usuario,
      id_filial: idFilialSelecionada,
      token: chave,
      id_profissional: idProfissionalSelecionado,
      data_inicio: dataSelecionada,
      data_fim: dataSelecionada,
      expand: 'profissional($select=id,nome,conselhoNumero,especialidadeId,foto)',
      orderby: 'profissionalId, horaInicio'
    };

    fn_lista_agendamentos(parametrosAgendamentos)
      .then(dataAgendamento => {
        const listaAgendamentos = dataAgendamento.value || [];
        const horariosPorProfissional = {};

        listaAgendamentos.forEach(agendamento => {
          const agendaConfigId = agendamento.agendaConfigId;
          const id = agendamento.profissionalId;
          const nome = agendamento.profissional?.nome || 'Desconhecido';
          const foto = agendamento.profissional?.foto || '';
          const numeroConselho = agendamento.profissional?.conselhoNumero || 'NÃO INFORMADO';
          const especialidade = agendamento.profissional?.especialidade?.descricao || '';
          const hora = agendamento.horaInicio;

          if (!horariosPorProfissional[id]) {
            horariosPorProfissional[id] = {};
          }

          if (!horariosPorProfissional[id][agendaConfigId]) {
            horariosPorProfissional[id][agendaConfigId] = {
              id,
              agendaConfigId,
              nome,
              foto,
              numeroConselho,
              especialidade,
              horarios: []
            };
          }

          horariosPorProfissional[id][agendaConfigId].horarios.push(hora);
        });

        // TRANSFORMAR EM ARRAY E ORDENAR POR NOME
        const profissionaisLista = [];
        for (const profissionalId in horariosPorProfissional) {
          const agendas = horariosPorProfissional[profissionalId];
          for (const agendaConfigId in agendas) {
            profissionaisLista.push(agendas[agendaConfigId]);
          }
        }

        profissionaisLista.sort((a, b) =>
          a.nome.localeCompare(b.nome, 'pt', { sensitivity: 'base' })
        );

        // GERAR HTML ORDENADO
        let html = '';
        let i = 1;

        profissionaisLista.forEach(prof => {
          let horariosHtml = "<div class='container-fluid'><div class='row'>";
          let m = 1, t = 1;

          prof.horarios.forEach(horario => {
            const hora = formatarHorarioISO(horario);

            if (hora < "13:00") {
              if (m === 1) {
                horariosHtml += `<div class="col-12 col-md-6">
                  <h5 class="my-3 text-secondary"><i class="fa-solid fa-clock mr-3"></i> Manhã</h5>
                  <div class="d-grid gap-2 gridHorario">`;
              }
              horariosHtml += `<button class="btn horario-btn">${hora}</button>`;
              m++;
            } else {
              if (t === 1) {
                if (m > 1) horariosHtml += `</div></div><div class="col-12 col-md-6">`;
                horariosHtml += `<h5 class="my-3 text-secondary"><i class="fa-solid fa-clock mr-3"></i> Tarde</h5>
                  <div class="d-grid gap-2 gridHorario">`;
                t++;
              }
              horariosHtml += `<button class="btn horario-btn">${hora}</button>`;
            }
          });

          horariosHtml += `</div></div></div>`;

          if(i>1){
            html += '</div>';
            i=1;
          }

          html += `
            <div class="my-3 align-items-start border rounded horario-div" data-profissional-id="${prof.id}">
              <div class="d-flex align-items-start gap-4 mt-3 px-3 flex-wrap flex-md-nowrap">
                <div class="text-left">
                  <img 
                    data-profissional-id="${prof.id}"
                    data-foto-base64="${prof.foto}"
                    src="assets/images/foto-medico.png" 
                    class="img-fluid rounded border foto-medico lazy-foto" 
                    alt="Foto do médico" 
                    style="max-width: 90px; border: 1px solid #ccc !important;">
                </div>
                <div class="flex-grow-1">
                  <h3 class="mb-1">${prof.nome}</h3>
                  <small class="text-muted d-block">CRM: ${prof.numeroConselho}</small>
                  <small class="text-muted d-block">${prof.especialidade}</small>
                </div>
              </div>
              <div class="m-3 flex-grow-1">
                <h6 class="mb-1 text-secondary"><i class="fa-solid fa-calendar mr-3"></i> Data da agenda: ${dataSelecionadaFormatada}</h6>
              </div>
              <div class="m-3 flex-grow-1">
                ${horariosHtml}
              </div>
            </div>`;

            i++;
        });

        // INSERIR HTML FINAL
        const container = document.getElementById("agendasMedicos");
        container.innerHTML = html;

        // CARREGAR FOTOS BASE64
        setTimeout(() => {
          document.querySelectorAll('.lazy-foto').forEach(imgEl => {
            const fotoBase64 = imgEl.getAttribute('data-foto-base64');
            if (fotoBase64) {
              const novaImg = new Image();
              novaImg.onload = () => {
                imgEl.src = `data:image/png;base64,${fotoBase64}`;
              };
              novaImg.src = `data:image/png;base64,${fotoBase64}`;
            }
          });
        }, 100);

        loader.style.display = 'none';
      })
      .catch(err => {
        console.error("Erro ao listar agendamentos:", err);
        loader.style.display = 'none';
      });
  }
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

    // Listar convênios
    const parametrosConvenios = {
      id_usuario: id_usuario,
      token: chave,
      id_convenio: idConvenioSelecionado
    };
    fn_lista_convenio(parametrosConvenios)
      .then(data => {
        const listaConvenios = data.value;
        const selectConvenio = document.getElementById('convenioSelect');
        selectConvenio.innerHTML = '<option value="">Selecione o convênio</option>';

        if (Array.isArray(listaConvenios)) {
          listaConvenios.forEach(convenio => {
            const option = document.createElement('option');
            option.value = convenio.id;
            option.textContent = convenio.nomeFantasia;
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

        // Listar filiais
        const parametrosFiliais = {
          id_usuario: id_usuario,
          token: chave
        };
        fn_lista_filiais(parametrosFiliais)
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

/*###########################################################################################
    Selecionar datas agendamentos
############################################################################################*/ 
$('#unidadeSelect, #medicoSelect').on('select2:select', function () {

    document.getElementById('datasAgendamento').innerHTML = "";  
    document.getElementById("agendasMedicos").innerHTML = "";  

    const idSelecionado = $(this).attr('id');
    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    const token = JSON.parse(sessionStorage.getItem('token'));
    const id_usuario = usuario.id_usuario;
    const chave = token.chave;
    const idFilialSelecionada = document.getElementById('unidadeSelect').value;
    const idProfissionalSelecionado = (idSelecionado === "medicoSelect") ? document.getElementById('medicoSelect').value : "";
    const lista_profissionais = []; // Opcional se precisar preencher select
    const lista_datas = [];
    const promises = [];

    //Carrega loader=============
    loader.style.display = 'flex';    

    //Lista agendamentos=====================================================================
    const parametrosAgendamentos = {
        id_usuario: id_usuario,
        id_filial: idFilialSelecionada,
        token: chave,
        id_profissional: idProfissionalSelecionado,
        expand: 'profissional($select=id,nome)'/*,
        data_inicio: '2025-06-26',
        data_fim: '2025-07-15'*/
    };

    const promessa = fn_lista_agendamentos(parametrosAgendamentos)
        .then(dataAgendamento => {
            const listaAgendamentos = dataAgendamento.value;
            if (Array.isArray(listaAgendamentos)) {
                listaAgendamentos.forEach(agendamento => {
                    //Lista datas============================================================
                    if (agendamento.dataInicio) {
                        
                        const somenteData = agendamento.dataInicio.split("T")[0];
                        if (!lista_datas.includes(somenteData)) {
                            lista_datas.push(somenteData);
                        }
                    }                      
                    //Lista profissionais=====================================================
                    if (agendamento.profissional) {
                      const jaExiste = lista_profissionais.some(p => p.id === agendamento.profissional.id);
                      if (!jaExiste) {
                        lista_profissionais.push(agendamento.profissional);
                      }
                    }                   
                });
            }
        })
        .catch(err => {
            console.error("Erro ao listar agendamentos:", err);
        });

    promises.push(promessa);

    Promise.all(promises).then(() => {
        if (lista_datas.length > 0) {
            const containerDatas = document.getElementById('datasAgendamento');
            containerDatas.innerHTML = '';

            const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

            lista_datas.forEach(dataStr => {
                const [ano, mes, dia] = dataStr.split('-');
                const dataObj = new Date(ano, mes - 1, dia);

                const diaSemana = diasSemana[dataObj.getDay()];
                const diaFormatado = String(dataObj.getDate()).padStart(2, '0');
                const mesNome = meses[dataObj.getMonth()];

                const html = `
                <button class="btn data-btn text-center" data-data-agenda="${ano}-${mes}-${dia}" data-data-agenda-formatada="${dia}/${mes}/${ano}"> 
                    <span class="small d-block">${diaSemana}</span>
                    <span class="text-lg fw-bold fs-2 d-block">${diaFormatado}</span>
                    <span class="small d-block">${mesNome}</span>
                </button>`;

                containerDatas.insertAdjacentHTML('beforeend', html);

            });

            document.getElementById('proximaDataDisponivelDiv').style.display = "block";

            //Carrega profissionais============================================================================ 
            if(!idProfissionalSelecionado){           
                // Ordena por nome (alfabético)
                lista_profissionais.sort((a, b) => a.nome.localeCompare(b.nome));

                // Preenche o select
                const selectMedico = document.getElementById('medicoSelect');
                selectMedico.innerHTML = '<option value="">Todos os Médicos</option>';

                lista_profissionais.forEach(profissional => {
                  const option = document.createElement('option');
                  option.value = profissional.id;
                  option.textContent = profissional.nome;

                  if (idProfissionalSelecionado && profissional.id == idProfissionalSelecionado) {
                    option.selected = true;
                  }

                  selectMedico.appendChild(option);
                });

                if ($(selectMedico).hasClass("select2-hidden-accessible")) {
                  $(selectMedico).trigger('change.select2');
                }
            }      

        }

        //Fecha loader===============
        loader.style.display = 'none';
    }).catch(() => {
        //Fecha loader===============
        loader.style.display = 'none';
    });
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
   document.addEventListener('DOMContentLoaded', () => {
    const dataScroll = document.getElementById('dataScroll');
    const scrollLeft = document.getElementById('scrollLeft');
    const scrollRight = document.getElementById('scrollRight');

    if (dataScroll && scrollLeft && scrollRight) {
      scrollLeft.addEventListener('click', () => {
        dataScroll.scrollBy({ left: -200, behavior: 'smooth' });
      });

      scrollRight.addEventListener('click', () => {
        dataScroll.scrollBy({ left: 200, behavior: 'smooth' });
      });
    }
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
