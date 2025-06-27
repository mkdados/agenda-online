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
    const lista_agendas_profissionais = [];

    const btn = e.target.closest('.data-btn');
    document.querySelectorAll('.data-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const dataSelecionada = btn.getAttribute('data-data-agenda');
    const dataSelecionadaFormatada = btn.getAttribute('data-data-agenda-formatada');

    document.getElementById("agendasMedicos").innerHTML = "";
    loader.style.display = 'flex';

    const parametrosAgendamentos = {
      id_usuario: id_usuario,
      id_filial: idFilialSelecionada,
      token: chave,
      id_profissional: idProfissionalSelecionado,
      data_inicio: dataSelecionada,
      data_fim: dataSelecionada,
      expand: 'profissional($select=id,nome,foto)',
      orderby: 'profissionalId, agendaConfigId'
    };

    fn_lista_agendamentos(parametrosAgendamentos)
      .then(dataAgendamento => {
        const listaAgendamentos = dataAgendamento.value || [];

        const horariosPorProfissional = {};

        listaAgendamentos.forEach(agendamento => {
          lista_agendas_profissionais.push(agendamento);

          const agendaConfigId = agendamento.agendaConfigId;
          const id = agendamento.profissionalId;
          const nome = agendamento.profissional?.nome || 'Desconhecido';
          const foto = agendamento.profissional?.foto || '';
          const numeroConselho = agendamento.profissional?.conselhoNumero || '';
          const especialidade = agendamento.profissional?.especialidade?.descricao || '';
          const hora = agendamento.horaInicio;

          // Garante que o objeto do agendaconfigId exista
          if (!horariosPorProfissional[id]) {
            horariosPorProfissional[id] = {};
          }

          // Garante que o objeto do profissionalId dentro do agendaconfigId exista
          if (!horariosPorProfissional[id][agendaConfigId]) {
            horariosPorProfissional[id][agendaConfigId] = {
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

        // Monta HTML
        let html = '';

        for (const agendaConfigId in horariosPorProfissional) {
          const profissionais = horariosPorProfissional[agendaConfigId];

          for (const id in profissionais) {
            const prof = profissionais[id];

            const horariosHtml = prof.horarios.length > 0
              ? prof.horarios.map(h => `<button class="btn horario-btn">${formatarHorarioISO(h)}</button>`).join('')
              : '<p class="text-muted">Nenhum horário disponível.</p>';

            html += `
              <div class="mt-3 align-items-start border rounded horario-div" data-profissional-id="${id}">
                <div class="d-flex align-items-start gap-4 mt-3 px-3 flex-wrap flex-md-nowrap">
                  <div class="text-left">                  
                    <img src="data:image/jpeg;base64,${prof.foto}" class="img-fluid rounded border" alt="Foto do médico" style="max-width: 120px;">
                  </div>
                  <div class="flex-grow-1">
                    <h3 class="mb-1">${prof.nome}</h3>
                    <small class="text-muted d-block">CRM: ${prof.numeroConselho}</small>
                    <small class="text-muted d-block">${prof.especialidade}</small>
                    <small class="text-muted d-block">Agenda Config: ${prof.agendaConfigId}</small>
                  </div>
                </div>
                <div class="m-3 flex-grow-1">
                  <h6 class="mb-1 text-secondary"><i class="fa-solid fa-calendar mr-3"></i> Data: ${dataSelecionadaFormatada}</h6>
                </div>
                <div class="m-3 flex-grow-1">
                  <div class="d-grid gap-2 gridHorario">             
                    ${horariosHtml}
                  </div>
                </div>
              </div>`;
          }
        }

        document.getElementById("agendasMedicos").innerHTML = html;

        loader.style.display = 'none';
      })
      .catch(err => {
        console.error("Erro ao listar agendamentos:", err);
        loader.style.display = 'none';
      });
  }
});




//  document.getElementById('datasAgendamento').addEventListener('click', async function(e) {
//   if (e.target.closest('.data-btn')) {

//     //Limpa div agendasMedicos===========================================
//     document.getElementById("agendasMedicos").innerHTML = "";  

//     //Seleciona data================================================
//     const btn = e.target.closest('.data-btn');
//     document.querySelectorAll('.data-btn').forEach(b => b.classList.remove('selected'));
//     btn.classList.add('selected');
//     const dataSelecionada = btn.getAttribute('data-data-agenda');
//     const dataSelecionadaFormatada = btn.getAttribute('data-data-agenda-formatada');

//     //Loader=========================================
//     loader.style.display = 'flex'; // mostra o loader  

//     /*-------------------- Lista agenda config --------------------*/
//     const usuario = JSON.parse(sessionStorage.getItem('usuario'));
//     const token = JSON.parse(sessionStorage.getItem('token'));
//     const id_usuario = usuario.id_usuario;
//     const chave = token.chave;
//     const idFilialSelecionada = document.getElementById('unidadeSelect').value;
//     const idProfissionalSelecionado = document.getElementById('medicoSelect').value;
//     const lista_profissionais = [];
//     const lista_agendamentos = [];

//     const parametrosAgendaConfig = {
//         id_usuario: id_usuario,
//         token: chave,
//         id_filial: (idFilialSelecionada) ? idFilialSelecionada : "",
//         id_profissional: (idProfissionalSelecionado) ? idProfissionalSelecionado : ""
//     };

//     try {
//         const data = await fn_lista_agenda_config(parametrosAgendaConfig);
//         const listaAgendaConfig = data.value;

//         if (Array.isArray(listaAgendaConfig)) {
//             for (const agendaConfig of listaAgendaConfig) {

//               // Dados do profissional
//                 const jaExisteProfissional = lista_profissionais.some(p => p.id === agendaConfig.profissional.id);
//                 if (!jaExisteProfissional) {

//                   const id_profissional = (idProfissionalSelecionado) ? idProfissionalSelecionado : agendaConfig.profissionalId;

//                     // Buscar profissionais
//                     const parametrosProfissionais = {
//                         id_usuario: id_usuario,
//                         token: chave,
//                         id_profissional: id_profissional
//                     };
//                     try {
//                         const listaProfissionais = await fn_lista_profissionais(parametrosProfissionais);
//                         lista_profissionais.push(listaProfissionais);

//                     } catch (erroProfissionais) {
//                         console.error("Erro ao listar profissionais:", erroProfissionais);
//                         loader.style.display = 'none';
//                     }
                    
//                 }

//                 // Buscar agendamentos
//                 const parametrosAgendamentos = {
//                     id_usuario: id_usuario,
//                     id_filial: idFilialSelecionada,
//                     token: chave,
//                     id_agenda_config: agendaConfig.id,
//                     id_profissional: agendaConfig.profissionalId,
//                     data_inicio: dataSelecionada,
//                     data_fim: dataSelecionada
//                 };

//                 try {
//                     const dataAgendamento = await fn_lista_agendamentos(parametrosAgendamentos);
//                     const listaAgendamentos = dataAgendamento.value;

//                     for (const agendamento of listaAgendamentos) {
//                       lista_agendamentos.push(agendamento);
//                     }                    

//                 } catch (erroAgendamento) {
//                     console.error("Erro ao listar agendamentos:", erroAgendamento);
//                     loader.style.display = 'none';
//                 }
//             }
//         }

//     } catch (error) {
//         console.error("Erro ao listar agenda config:", error);
//         loader.style.display = 'none';
//     }

//     /*-------------------- Lista agendamentos dos profissionais --------------------*/
//     var html = "";

//     for (const profissional of lista_profissionais) {

//       const profissionalId = profissional?.id ?? "";
//       const profissionalFoto = "data:image/jpeg;base64,"+profissional.foto ?? 'assets/images/foto-medico-1.jpg';
//       const nomeProfissional = profissional?.nome ?? "";
//       const numeroConselho = "CRM: "+profissional?.conselhoNumero ?? "";
//       const especialidade = profissional?.especialidade?.descricao ?? "";
//       let horarios = "";

//       for (const agendamento of lista_agendamentos) {
//         if (agendamento.profissionalId == profissional.id) {
//           const horaInicio = formatarHorarioISO(agendamento.horaInicio);
//           horarios += `
//             <button class="btn horario-btn">${horaInicio}</button>
//           `;
//         }
//       }      

//       html += `
//         <div class="mt-3 align-items-start border rounded horario-div" data-profissional-id="${profissionalId}">
//           <div class="d-flex align-items-start gap-4 mt-3 px-3 flex-wrap flex-md-nowrap">
//             <div class="text-left">                  
//               <img src="${profissionalFoto}" class="img-fluid rounded border" alt="Foto do médico" style="max-width: 120px;">
//             </div>
//             <div class="flex-grow-1">
//               <h3 class="mb-1">${nomeProfissional}</h3>
//               <small class="text-muted d-block">${numeroConselho}</small>
//               <small class="text-muted d-block">${especialidade}</small>
//             </div>
//           </div>
//           <div class="m-3 flex-grow-1">
//              <h6 class="mb-1 text-secondary"><i class="fa-solid fa-calendar mr-3"></i> Data: ${dataSelecionadaFormatada}</h6>
//           </div>
//           <div class="m-3 flex-grow-1">
//             <div class="d-grid gap-2 gridHorario">             
//               ${horarios || '<p class="text-muted">Nenhum horário disponível.</p>'}
//             </div>
//           </div>
//         </div>
//       `;
//     }

//     // Atualiza o DOM
//     document.getElementById("agendasMedicos").innerHTML = html;   

//     //Fecha o loader===============
//     loader.style.display = 'none';
//   }
// });



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
