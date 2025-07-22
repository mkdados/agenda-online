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

  document.getElementById("btnGoToStep2").disabled = true;
  document.getElementById("btnGoToStep3").disabled = true;

/*###########################################################################################
    Script para selecionar data
############################################################################################*/ 
document.getElementById('datasAgendamento').addEventListener('click', function (e) {
  const btn = e.target.closest('.data-btn');
  if (btn) {
    fn_carrega_agendamentos(btn);
  }
});

// === Evento de clique nos botões de turno (radio buttons) ===
document.querySelectorAll('input[name="turno"]').forEach(radio => {
  radio.addEventListener('click', () => {
    const btnSelecionado = document.querySelector('.data-btn.selected');
    if (btnSelecionado) {
      fn_carrega_agendamentos(btnSelecionado);
    }
  });
});


// === Função reutilizável para carregar agendamentos com base na data selecionada ===
function fn_carrega_agendamentos(btn) {
  // Se o botão não for passado, pega o atualmente selecionado
  if (!btn) {
    btn = document.querySelector('.data-btn.selected');
    if (!btn) return;
  }

  // Marcar como selecionado
  document.querySelectorAll('.data-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  // Coletar dados da sessão e inputs
  const usuario = JSON.parse(sessionStorage.getItem('usuario'));
  const token = JSON.parse(sessionStorage.getItem('token'));
  const chave = token?.chave;
  const id_organizacao = token?.id_organizacao;
  const id_usuario = usuario?.id_usuario; 
  const idFilialSelecionada = document.getElementById('unidadeSelect').value;
  const idProfissionalSelecionado = document.getElementById('medicoSelect').value;
  const turnoSelecionado = document.querySelector('input[name="turno"]:checked').value;

  const dataSelecionada = btn.getAttribute('data-data-agenda');
  const dataSelecionadaFormatada = btn.getAttribute('data-data-agenda-formatada');

  // Limpar agenda atual e exibir loader
  document.getElementById("agendasMedicos").innerHTML = "";
  loader.style.display = 'flex';

  // Parâmetros para listar agendamentos
  const parametrosAgendamentos = {
    id_usuario,
    id_organizacao: id_organizacao,
    id_filial: idFilialSelecionada,
    token: chave,
    id_profissional: idProfissionalSelecionado,
    data_inicio: dataSelecionada,
    data_fim: dataSelecionada,
    turno: turnoSelecionado,
    select: 'id, organizacaoId, filialId, profissionalId, dataInicio, horaInicio, agendaConfigId',
    expand: 'profissional($select=id,nome,conselhoNumero,especialidadeId),agendaconfig($select=filialId)',
    orderby: 'profissionalId, horaInicio'
  };

  fn_lista_agendamentos(parametrosAgendamentos)
    .then(dataAgendamento => {
      const listaAgendamentos = dataAgendamento.value || [];
      const horariosPorProfissional = {};

      listaAgendamentos.forEach(agendamento => {
        const {
          id,
          agendaConfigId,
          profissionalId: profissionalId,
          profissional = {},
          horaInicio: hora
        } = agendamento;

        const nome = profissional.nome || 'Desconhecido';
        const foto = profissional.foto || '';
        const numeroConselho = profissional.conselhoNumero || 'NÃO INFORMADO';
        const especialidade = profissional.especialidade?.descricao || '';

        if (!horariosPorProfissional[profissionalId]) horariosPorProfissional[profissionalId] = {};
        if (!horariosPorProfissional[profissionalId][agendaConfigId]) {
          horariosPorProfissional[profissionalId][agendaConfigId] = {
            id, agendaConfigId, profissionalId, nome, foto, numeroConselho, especialidade, horarios: []
          };
        }
        horariosPorProfissional[profissionalId][agendaConfigId].horarios.push({'id': id,'hora': hora});
      });

      const profissionaisLista = [];
      for (const profId in horariosPorProfissional) {
        for (const agId in horariosPorProfissional[profId]) {
          profissionaisLista.push(horariosPorProfissional[profId][agId]);
        }
      }

      profissionaisLista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt', { sensitivity: 'base' }));

      // Gerar HTML dos cards
      let html = '';
      let i = 1;
      profissionaisLista.forEach(prof => {
        let horariosHtml = "<div class='container-fluid'><div class='row'>";
        let m = 1, t = 1;

        prof.horarios.forEach(horario => {
          const hora = formatarHorarioISO(horario.hora);
          if (hora < "13:00") {
            if (m === 1) {
              horariosHtml += `<div class="col-12 col-md-6 ps-0 mb-3 mb-md-0">
                <h5 class="mt-2 mb-3 text-secondary"><i class="fa-solid fa-clock mr-3"></i> Manhã</h5>
                <div class="d-grid gap-2 gridHorario">`;
            }
            horariosHtml += `<button class="btn horario-btn" data-id-agenda-md="${horario.id}">${hora}</button>`;
            m++;
          } else {
            if (t === 1) {
              if (m > 1) horariosHtml += `</div></div><div class="col-12 col-md-6 ps-0 ps-md-3">`;
              horariosHtml += `<h5 class="mt-2 mb-3 text-secondary"><i class="fa-solid fa-clock mr-3"></i> Tarde</h5>
                <div class="d-grid gap-2 gridHorario">`;
            }
            horariosHtml += `<button class="btn horario-btn" data-id-agenda-md="${horario.id}">${hora}</button>`;
            t++;
          }
        });

        horariosHtml += `</div></div></div>`;

        if (i > 1) {
          html += '</div>';
          i = 1;
        }

        html += `
          <div class="my-3 align-items-start border rounded horario-div" data-profissional-id="${prof.profissionalId}">
            <div class="d-flex align-items-start gap-4 mt-3 px-3 flex-wrap flex-md-nowrap">              
                <img 
                data-profissional-id="${prof.profissionalId}"
                src="assets/images/medicos/${prof.profissionalId}.png?v=${new Date().getTime()}" 
                onerror="this.onerror=null;this.src='assets/images/medicos/foto-medico.png';"
                class="foto-redonda img-fluid border lazy-foto mx-auto mx-md-0 d-block" 
                alt="Foto do médico">
              <div class="flex-grow-1">
                <h3 class="mb-1">${prof.nome}</h3>
                <small class="text-muted d-block"><strong>CRM:</strong> ${prof.numeroConselho}</small>
                <small class="text-muted d-block">Dermatologista</small>
                <small class="text-muted d-block">
                  <a href="https://dermaclinica.com.br/corpo-clinico/" target="blank" style="color:#000000"><i class="fa-solid fa-link me-2" style="color:#6c757d"></i> Formação e especializações</a>
                </small>
              </div>
            </div>
            <div class="mx-3 mt-4 flex-grow-1">
              <h6 class="mb-1 text-secondary">
                <i class="fa-solid fa-calendar me-2"></i> 
                Data da agenda: ${dataSelecionadaFormatada}
              </h6>
            </div>
            <div class="m-3 flex-grow-1">
              ${horariosHtml}
            </div>
          </div>`;
        i++;
      });

      //Seta a div
      if(html){
        document.getElementById("agendasMedicos").innerHTML = html;
      }else{        
        document.getElementById("agendasMedicos").innerHTML = '<div class="alert" role="alert" style="background-color:#f1e2df;color:#d47d48;">Nenhuma agenda disponível para agendamento</div>';
      }        

      loader.style.display = 'none';
    })
    .catch(err => {
      console.error("Erro ao listar agendamentos:", err);
      loader.style.display = 'none';
    });
}

/*###########################################################################################
    Script para selecionar horário
  ############################################################################################*/ 
document.getElementById('agendasMedicos').addEventListener('click', function (e) {
  const btn = e.target.closest('.horario-btn');
  if (btn) {
      document.querySelectorAll('.horario-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected'); // ou btn.classList.add('selected')      
  }
  //Habilita o botao
  document.getElementById("btnGoToStep3").disabled = false;
});


/*###########################################################################################
    Script para selecionar tipo de atendimento
############################################################################################*/ 
function selecionaTipoAtendimento() {
  var tipoAtendimento = document.querySelector('input[name="tipoAtendimento"]:checked').value;
  var convenioDiv = document.getElementById("convenioDiv");
  var planoDiv = document.getElementById("planoDiv");
  //var carteirinhaDiv = document.getElementById("carteirinhaDiv");
  var carteirinha = document.getElementById("carteirinha");

  if (tipoAtendimento === "convenio") {
    convenioDiv.style.display = "block";
    //planoDiv.style.display = "block";
    //carteirinhaDiv.style.display = "block";

    // Dados do storage
    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    const token = JSON.parse(sessionStorage.getItem('token'));
    const paciente = JSON.parse(sessionStorage.getItem('paciente'));
    const id_usuario = usuario.id_usuario;
    const chave = token.chave;
    //const numero_carteirinha = paciente.numero_carteirinha || '';
    const idConvenioSelecionado = paciente ? paciente.id_convenio : 0;    

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
            // if(numero_carteirinha) {
            //   carteirinha.value = numero_carteirinha;
            // }
            
          });

          // esconde o loader
          loader.style.display = 'none'; 
        } else {
          console.warn('Formato de resposta inesperado:', data);
          // esconde o loader
          loader.style.display = 'none'; 
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

  //Habilita o botao
  document.getElementById("btnGoToStep2").disabled = false;
  
}


/*###########################################################################################
    Script para selecionar unidade
  ############################################################################################*/ 

   document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('btnGoToStep2').addEventListener('click', function () {

      const tipoAtendimento = document.querySelector('input[name="tipoAtendimento"]:checked'); 
      const convenioSelect = document.getElementById('convenioSelect');
      const convenioValor = convenioSelect.value;  // pega o valor da option selecionada  

      if (!tipoAtendimento) {
          Swal.fire({
            icon: 'info',
            title: 'Aviso',
            text: 'Selecione o tipo de atendimento'
          });
      }
      else if (tipoAtendimento.value === "convenio" && (!convenioValor || convenioValor === "")) {
          Swal.fire({
            icon: 'info',
            title: 'Aviso',
            text: 'Selecione o convênio'
          });
      }
      else{

        // Dados do storage
        const usuario = JSON.parse(sessionStorage.getItem('usuario'));
        const token = JSON.parse(sessionStorage.getItem('token'));
        const id_usuario = usuario.id_usuario;
        const chave = token.chave; 
        const selectFilial = document.getElementById('unidadeSelect'); 

        if (!selectFilial.value) {

          loader.style.display = 'flex'; // mostra o loader       

          // Listar filiais
          const parametrosFiliais = {
            id_usuario: id_usuario,
            token: chave
          };
          fn_lista_filiais(parametrosFiliais)
            .then(data => {
                const listaFilials = data.value;
                selectFilial.innerHTML = '<option value="">Selecione uma unidade</option>';

                if (Array.isArray(listaFilials)) {

                  //Filiais
                  listaFilials.forEach(filial => {
                    const option = document.createElement('option');

                    //Endereço------------------------
                    let endereco = "";
                    let endereco_logradouro = (filial.endereco) ? filial?.endereco?.logradouro : "";
                    let endereco_numero =  (filial.endereco) ? filial?.endereco?.numero : "";
                    let endereco_complemento =  (filial.endereco) ? filial?.endereco?.complemento : "";
                    let endereco_bairro =  (filial.endereco) ? filial?.endereco?.bairro : "";
                    let endereco_municipio =  (filial.endereco) ? filial?.endereco?.municipio : "";
                    let endereco_uf =  (filial.endereco) ? filial?.endereco?.uf : "";
                    let endereco_maps = "";
                    let endereco_link = "";

                    endereco += (endereco_logradouro) ? endereco_logradouro : "";
                    endereco += (endereco_numero) ? ", "+endereco_numero : "";
                    endereco += (endereco_complemento) ? ", "+endereco_complemento : "";
                    endereco += (endereco_bairro) ? ", "+endereco_bairro : "";
                    endereco += (endereco_municipio) ? ", "+endereco_municipio : "";
                    endereco += (endereco_uf) ? " - "+endereco_uf : "";

                    if(endereco){
                      endereco_maps = `https://www.google.com/maps/search/?api=1&query=${endereco_logradouro},+${endereco_numero},+${endereco_municipio},+${endereco_uf}`;
                      endereco_link = `<a href="${endereco_maps}" target="_blank" rel="noopener" style="color:#000000;">${endereco}</a>`;
                    }             

                    //Option----------------------------------------------
                    option.value = filial.id;
                    option.textContent = filial.nomeCompleto;
                    option.setAttribute('data-endereco-unidade', endereco_link);
                    selectFilial.appendChild(option);
                  });

                  loader.style.display = 'none'; // esconde o loader
                } else {
                  console.warn('Formato de resposta inesperado:', data);
                  loader.style.display = 'none'; // esconde o loader
                }

                //Avança a etapa
                goToStep(2);
            })
            .catch(error => {
              console.error('Erro ao carregar filiais:', error.message);
              loader.style.display = 'none';
            });

        }else{
          //Avança a etapa
          goToStep(2);
        }
      
      }        
        
    });
  });  

/*###########################################################################################
    Selecionar datas agendamentos
############################################################################################*/ 
$('#unidadeSelect').on('select2:select', async function () {

  // Zera select medico======================================
  const selectMedico = document.getElementById('medicoSelect');
  selectMedico.innerHTML = '<option value="">Todos os Médicos</option>';

  const idFilialSelecionada = document.getElementById('unidadeSelect').value;

  //Esconde datas disponíveis=========================================
  document.getElementById('proximaDataDisponivelDivErro').style.display = "none";
  document.getElementById('proximaDataDisponivelDiv').style.display = "none"; 

  //Limpar datas selecionadas========================================
  const containerDatas = document.getElementById('datasAgendamento');

  if(containerDatas){
    containerDatas.innerHTML = '';
  }    
  

  if(idFilialSelecionada){

    //Selecionar datas
    fn_selecionar_datas("selectUnidade",""); 

      //  //Carrega loader=============
      // loader.style.display = 'flex'; 

      // //Agenda config================================================
      // const usuario = JSON.parse(sessionStorage.getItem('usuario'));
      // const token = JSON.parse(sessionStorage.getItem('token'));
      // const id_usuario = usuario.id_usuario;
      // const id_organizacao = token?.id_organizacao;
      // const chave = token.chave;

      // const parametrosAgendaConfig = {
      //   id_usuario: id_usuario,
      //   id_organizacao: id_organizacao,
      //   id_filial: idFilialSelecionada,
      //   token: chave    
      // };

      // let id_agenda_config = ""; 
      // let profissional_id = ""; 
      // let profissionaisAgendaConfig = []; // Lista de { id, nome }

      // try {
      //   const dataAgendaConfig = await fn_lista_agenda_config(parametrosAgendaConfig);

      //   if (dataAgendaConfig?.value?.length > 0) {
      //     // Extrai os IDs e junta por vírgula
      //     id_agenda_config = dataAgendaConfig.value.map(item => item.id).join(",");
      //     profissional_id = dataAgendaConfig.value.map(item => item.profissionalId).join(",");

      //     // Pega o ID do profissional e o nome
      //     dataAgendaConfig.value.forEach(item => {
      //       const profissional = item.profissional;
      //       if (profissional?.id && profissional?.nome) {
      //         const jaExiste = profissionaisAgendaConfig.some(p => p.id === profissional.id);
      //         if (!jaExiste) {
      //           profissionaisAgendaConfig.push({
      //             id: profissional.id,
      //             nome: profissional.nome
      //           });

      //         }
      //       }
      //     });

      //     //Carrega foto do profissional
      //     const parametros = {
      //       id_usuario: id_usuario,
      //       token: chave,
      //       id_profissional: profissional_id
      //     };

      //     try {
      //       const data = fn_lista_profissionais(parametros);
      //     } catch (erro) {
      //       //console.warn("Erro ao carregar foto:", erro);
      //     }


      //     //Salvar dados no banco IndexedDB
      //     await salvarAgendaConfigIndexedDB(id_agenda_config, profissional_id, profissionaisAgendaConfig);  
          
      //     //Selecionar datas
      //     fn_selecionar_datas("selectUnidade",""); 

      //   } else {
      //     //console.warn("Nenhuma agenda config encontrada");
      //     //Carrega loader=============
      //     loader.style.display = 'none'; 

      //     Swal.fire({
      //       toast: true,
      //       icon: 'info',
      //       title: 'Sem datas disponíveis para agendamento',
      //       position: 'bottom-end',
      //       showConfirmButton: false,
      //       timer: 3000,
      //       timerProgressBar: true,
      //       didOpen: (toast) => {
      //         toast.addEventListener('mouseenter', Swal.stopTimer)
      //         toast.addEventListener('mouseleave', Swal.resumeTimer)
      //       }
      //     });
          
      //   }
      // } catch (err) {
      //   //console.error("Erro ao listar agendamentos:", err);
      //    //Carrega loader=============
      //    loader.style.display = 'none'; 
      // }     
      

      //   // Função para salvar os dados
      //   async function salvarAgendaConfigIndexedDB(id_agenda_config, profissional_id, profissionaisAgendaConfig) {
      //     try {
      //       const db = await openIndexedDB();
      //       const tx = db.transaction('agendaConfig', 'readwrite');
      //       const store = tx.objectStore('agendaConfig');

      //       const dados = {
      //         id: 'config1', // Chave primária fixa ou pode ser dinâmica
      //         id_agenda_config,
      //         profissional_id,
      //         profissionaisAgendaConfig
      //       };

      //       store.put(dados);

      //       tx.oncomplete = () => {
      //         //console.log('Dados salvos com sucesso no IndexedDB.');
      //         db.close();
      //       };

      //       tx.onerror = () => {
      //         console.error('Erro ao salvar no IndexedDB:', tx.error);
      //       };
      //     } catch (error) {
      //       console.error('Erro ao abrir IndexedDB:', error);
      //     }
      //   }
       
  } 
});

$('#medicoSelect').on('select2:select', function () {  

  //Esconde datas disponíveis=========================================
  document.getElementById('proximaDataDisponivelDivErro').style.display = "none";
  document.getElementById('proximaDataDisponivelDiv').style.display = "none";

  //Limpar datas selecionadas========================================
  const containerDatas = document.getElementById('datasAgendamento');

  if(containerDatas){
    containerDatas.innerHTML = ''; 
  }
  

  fn_selecionar_datas("selectMedico","");    
});

//Selecionar mais datas========================================
$('#scrollRight').on('click', function () {

  //Validar scroll lateral===========================================================================
  const scrollContainer = document.getElementById('dataScroll');
  const hasHorizontalScroll = scrollContainer.scrollWidth > scrollContainer.clientWidth;
  var carrega_datas = "N";

  // Verifica se existe scroll horizontal
  if (hasHorizontalScroll) {
      const scrollLeft = scrollContainer.scrollLeft;
      const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;

      // Verifica se chegou ao final do scroll (com margem de erro de 1px para evitar problemas de arredondamento)
      if (Math.abs(scrollLeft - maxScrollLeft) <= 30) {        
        carrega_datas = "S";      
      }
  }else{
    carrega_datas = "S";  
  }

  if(carrega_datas=="S"){
    const container = document.getElementById("datasAgendamento");
    const botoes = container.querySelectorAll(".data-btn");
    const primeiroBotao = botoes[0];
    const ultimoBotao = botoes[botoes.length - 1]; 

    // Pegando os valores dos atributos data
    const data_inicio = primeiroBotao.getAttribute("data-data-agenda");
    const data_fim = ultimoBotao.getAttribute("data-data-agenda"); 

    //Remover justify-content-center
    document.getElementById('dataScroll').classList.remove('justify-content-center');


    fn_selecionar_datas("maisDatas",data_fim);   
    
  }
    
});

async function fn_selecionar_datas(evento,data_inicio){  

    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    const token = JSON.parse(sessionStorage.getItem('token'));
    const id_usuario = usuario.id_usuario;
    const id_organizacao = token?.id_organizacao;
    const chave = token.chave;
    const idFilialSelecionada = document.getElementById('unidadeSelect').value;
    const idProfissionalSelecionado = document.getElementById('medicoSelect').value; 
    const lista_datas = [];
    const promises = [];

    //Carrega loader=============
    loader.style.display = 'flex'; 
    
    //Setar dom=================================================
    // document.getElementById('datasAgendamento').innerHTML = "";  
    document.getElementById("agendasMedicos").innerHTML = "";  

    //Buscar dados AgendaConfig no banco indexedDB=====================
      async function lerAgendaConfig() {
        const db = await openIndexedDB();
        const tx = db.transaction('agendaConfig', 'readonly');
        const store = tx.objectStore('agendaConfig');

        const dados = await new Promise((resolve, reject) => {
          const req = store.get('config1');
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });

        db.close();
        return dados;
      }

      let id_agenda_config = "";
      let profissional_id = "";
      let profissionaisAgendaConfig = []; // Lista de { id, nome }

      
      // try {
      //   const dados = await lerAgendaConfig();
      //   console.log(dados);
      //   if (dados) {
      //     id_agenda_config = dados.id_agenda_config || "";
      //     profissional_id = dados.profissional_id || "";
      //     profissionaisAgendaConfig = dados.profissionaisAgendaConfig || [];
      //   } else {
      //     // Se não tiver dados salvos, mantém os valores padrão
      //     console.log('Nenhuma configuração de agenda encontrada no IndexedDB.');
      //   }

      // } catch (error) {
      //   console.error('Erro ao carregar dados da agenda:', error);
      // }

      try {
        const dados = await lerAgendaConfig();
        console.log(dados);

        if (dados) {
          // Filtra os profissionais da filial selecionada dinamicamente
          const profissionaisFilialSelecionada = (dados.profissionaisAgendaConfig || []).filter(
            p => p.id_filial == idFilialSelecionada
          );

          profissionaisAgendaConfig = profissionaisFilialSelecionada;

          // Junta os IDs e os agenda_config correspondentes
          profissional_id = profissionaisFilialSelecionada.map(p => p.id).join(',');

          id_agenda_config = [...new Set(
            profissionaisFilialSelecionada
              .flatMap(p => (p.id_agenda_config || '').split(','))
              .filter(id => id !== '')
          )].join(',');

        } else {
          console.log('Nenhuma configuração de agenda encontrada no IndexedDB.');
        }

      } catch (error) {
        console.error('Erro ao carregar dados da agenda:', error);
      }



    //Lista agendamentos=====================================================================
    const parametrosAgendamentos = {
        id_usuario: id_usuario,
        id_organizacao: id_organizacao,
        id_filial: idFilialSelecionada,
        token: chave,
        id_agenda_config: id_agenda_config,
        id_profissional: profissional_id,
        select: 'dataInicio',
        orderby: 'dataInicio'      
    };

    if(idProfissionalSelecionado){
        parametrosAgendamentos["id_profissional"] = idProfissionalSelecionado;
    }

    if(data_inicio){
        parametrosAgendamentos["evento"] = evento;
        parametrosAgendamentos["data_inicio"] = data_inicio;
    }else{
        parametrosAgendamentos["evento"] = "carrega_datas";
    }

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

            const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

            let contador = 1;

            lista_datas.forEach(dataStr => {   
              
              if (contador > 7) return; // Limita a 7 datas

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

                contador++;

            });

            //Mostra datas disponíveis
            document.getElementById('proximaDataDisponivelDiv').style.display = "block";

            //Carrega profissionais============================================================================ 
            if(evento=="selectUnidade"){           
                // Ordena por nome (alfabético)
                profissionaisAgendaConfig.sort((a, b) => a.nome.localeCompare(b.nome));

                // Preenche o select
                const selectMedico = document.getElementById('medicoSelect');
                selectMedico.innerHTML = '<option value="">Todos os Médicos</option>';

                profissionaisAgendaConfig.forEach(profissional => {
                  
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
        else{

          //Seta div  
          if(evento!="maisDatas"){
              document.getElementById('proximaDataDisponivelDivErro').innerHTML = '<div class="alert" role="alert" style="background-color:#f1e2df;color:#d47d48;">Nenhuma agenda disponível para agendamento</div>';
              document.getElementById('proximaDataDisponivelDivErro').style.display = "block";
              document.getElementById('proximaDataDisponivelDiv').style.display = "none";
          } 
          

          //======
          Swal.fire({
            toast: true,
            icon: 'info',
            title: 'Sem datas disponíveis para agendamento',
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.addEventListener('mouseenter', Swal.stopTimer)
              toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
          });
        }

        // scroll suavemente para o final da lista de datas
        if (evento == "maisDatas") {
            const scrollContainer = document.getElementById('dataScroll');

            setTimeout(() => {
                //console.log("Rolando para a direita");

                scrollContainer.scrollTo({
                    left: scrollContainer.scrollLeft + 180, // rola mais visivelmente
                    behavior: 'smooth'
                });

            }, 50);
        }
       

        //Fecha loader===============
        loader.style.display = 'none';
    }).catch(() => {
        //Fecha loader===============
        loader.style.display = 'none';
    });
}


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


/*###########################################################################################
    Etapa confirmação
############################################################################################*/ 

   document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('btnGoToStep3').addEventListener('click', function () {

      // Seleciona o botão selecionado
      const botaoSelecionado = document.querySelector('.horario-btn.selected');
      const unidadeSelect = document.getElementById('unidadeSelect');
      const unidadeValor = unidadeSelect.value;

      if (!unidadeValor || unidadeValor === "") {
          Swal.fire({
            icon: 'info',
            title: 'Aviso',
            text: 'Selecione uma unidade'
          });
      }
      else if (!botaoSelecionado) {
          Swal.fire({
            icon: 'info',
            title: 'Aviso',
            text: 'Selecione um horário'
          });
      }
      else{

        // Sobe até a div que representa a agenda do médico
        const horarioDiv = botaoSelecionado.closest('.horario-div');

        // Nome do profissional
        const nomeProfissional = horarioDiv.querySelector('h3')?.textContent.trim();

        //Unidade
        const unidadeSelect = document.getElementById('unidadeSelect');
        const unidade = unidadeSelect.options[unidadeSelect.selectedIndex].text;
        const unidadeEndereco = unidadeSelect.options[unidadeSelect.selectedIndex].getAttribute('data-endereco-unidade');
      
        // Data da agenda
        const dataAgenda = horarioDiv.querySelector('h6')?.textContent
          .replace('Data da agenda:', '')
          .trim();

        // Hora selecionada
        const horaSelecionada = botaoSelecionado.textContent.trim();

        // Forma de pagamento
        var forma_pagamento = "";
        const tipoAtendimento = document.querySelector('input[name="tipoAtendimento"]:checked');  

        if (tipoAtendimento && tipoAtendimento.value === "convenio") {

          const convenioSelect = document.getElementById('convenioSelect');
          var convenio = "";
          
          if(convenioSelect){
            convenio = convenioSelect.options[convenioSelect.selectedIndex].text;            
          }
          
          forma_pagamento = "CONVÊNIO "+convenio;
        }
        else {
          forma_pagamento = "PARTICULAR";
        }        

        // Exibe os dados=========
        document.getElementById("confirmacao-nome-profissional").innerHTML = nomeProfissional;
        document.getElementById("confirmacao-unidade").innerHTML = unidade;
        document.getElementById("confirmacao-unidade-endereco").innerHTML = unidadeEndereco;
        document.getElementById("confirmacao-data").innerHTML = dataAgenda;
        document.getElementById("confirmacao-hora").innerHTML = horaSelecionada;
        document.getElementById("confirmacao-forma-pagamento").innerHTML = forma_pagamento;        
        
        
        //Avança a etapa======
        goToStep(3); 
              
        
      }
    });
  });  

/*###########################################################################################
    Agendar Paciente
############################################################################################*/
document.addEventListener('DOMContentLoaded', () => {
  const btnConfirmar = document.getElementById('btnConfirmarAgendamento');
  const loader = document.getElementById('loader');

  btnConfirmar.addEventListener('click', async () => {
    const confirm = await Swal.fire({
      title: "Confirma o agendamento?",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Sim"
    });

    if (!confirm.isConfirmed) return;

    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    const token = JSON.parse(sessionStorage.getItem('token'));
    const paciente = JSON.parse(sessionStorage.getItem('paciente'));
    const id_usuario = usuario?.id_usuario;
    const chave = token?.chave;
    const id_organizacao = token?.id_organizacao;
    const id_paciente = paciente?.id_paciente;
    const botaoSelecionado = document.querySelector('.horario-btn.selected');
    const id_agenda_md = botaoSelecionado?.getAttribute('data-id-agenda-md');
    const tipoAtendimento = document.querySelector('input[name="tipoAtendimento"]:checked')?.value;

    // Dados do agendamento=============================================================================
    const horarioDiv = botaoSelecionado.closest('.horario-div');
    // Data da agenda
    const dataAgenda = horarioDiv.querySelector('h6')?.textContent.replace('Data da agenda:', '').trim();
    // Hora selecionada
    const horaSelecionada = botaoSelecionado.textContent.trim();
    // Profissional
    const nomeProfissional = horarioDiv.querySelector('h3')?.textContent.trim();
    //Unidade
    const unidadeSelect = document.getElementById('unidadeSelect');
    const unidade = unidadeSelect.options[unidadeSelect.selectedIndex].text;
    const unidadeEndereco = unidadeSelect.options[unidadeSelect.selectedIndex].getAttribute('data-endereco-unidade');
    // Seta dados do agendamento
    const dados_agendamento = {data_agendamento: dataAgenda, 
                               hora_agendamento: horaSelecionada,
                               nome_profissional: nomeProfissional,
                               endereco_unidade: unidadeEndereco
                              };

    if (!id_agenda_md || !id_usuario || !id_paciente || !chave) {
      return exibirErro("Dados obrigatórios ausentes para realizar o agendamento.");
    }

    loader.style.display = 'flex';

    try {
      const proximasConsultas = await fn_lista_consultas({
        id_usuario,
        token: chave,
        id_paciente,
        id_agenda_status: 2,
        orderby: "dataInicio asc, horaInicio asc"
      });

      const consultaExistente = proximasConsultas.value?.[0];

      if (consultaExistente) {
        const dataConsulta = formatarDataISO(consultaExistente.dataInicio);
        const horaConsulta = formatarHorarioISO(consultaExistente.horaInicio);
        const id_agenda_md_agendado = consultaExistente.id;

        loader.style.display = 'none';

        const desejaCancelar = await Swal.fire({
          icon: "info",
          html: `Você já possui um agendamento para o dia ${dataConsulta} às ${horaConsulta}.<br>Deseja cancelar o agendamento?`,
          showCancelButton: true,
          confirmButtonText: "Sim, cancelar",
          cancelButtonText: "Não, manter"
        });

        if (!desejaCancelar.isConfirmed) return;

        loader.style.display = 'flex';

        const cancelamento = await fn_desmarcar_paciente({
          id_usuario,
          token: chave,
          id: id_agenda_md_agendado,
          data: {
            desmarcar: {
              justificativa: "DESMARCADO PELO PACIENTE VIA AGENDAMENTO ONLINE"
            }
          }
        });

        if (cancelamento?.status !== 200) {
          return exibirErro(cancelamento?.mensagem || cancelamento?.erro);
        }
      }

      // Agendamento final
      await agendarPaciente({ id_usuario, id_organizacao, chave, id_agenda_md, id_paciente, tipoAtendimento, dados_agendamento });
    } catch (error) {
      exibirErro("Ocorreu um erro ao processar o agendamento.");
      console.error(error);
    } finally {
      loader.style.display = 'none';
    }
  });

  function exibirErro(mensagem) {
    Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: mensagem
    });
  }

  async function agendarPaciente({ id_usuario, id_organizacao, chave, id_agenda_md, id_paciente, tipoAtendimento, dados_agendamento }) {
    const parametrosAgendamento = {
      id_usuario,
      id_organizacao,
      token: chave,
      data: {
        id: id_agenda_md,
        titulo: "AGENDAMENTO ONLINE",
        pacienteId: id_paciente,
        observacoes: "AGENDAMENTO ONLINE",
        agendaStatusId: 2,
        online: "S",
        tipoAtendimento: tipoAtendimento === "particular" ? "1" : "2"
      },
      dados_agendamento: dados_agendamento
    };

    if (tipoAtendimento === "convenio") {
      const convenioId = document.getElementById('convenioSelect')?.value;
      if (!convenioId) {
        return exibirErro("Por favor, selecione um convênio.");
      }
      parametrosAgendamento.data.convenioId = convenioId;
    }

    const resposta = await fn_agendar_paciente(parametrosAgendamento);

    if (resposta?.status === 200) {

       loader.style.display = 'none';
       
      await Swal.fire({
        position: "center",
        icon: "success",
        title: "Agendamento realizado com sucesso!",
        showConfirmButton: false,
        timer: 1500
      });     

      //Redireciona para a página de agendamentos
      window.location.href = 'meus-agendamentos.html', 1500;
    } else {
      exibirErro(resposta?.mensagem || resposta?.erro);
    }
  }
});

