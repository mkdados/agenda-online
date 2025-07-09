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

  const parametrosAgendamentos = {
    id_usuario,
    id_organizacao: id_organizacao,
    id_filial: idFilialSelecionada,
    token: chave,
    id_profissional: idProfissionalSelecionado,
    data_inicio: dataSelecionada,
    data_fim: dataSelecionada,
    turno: turnoSelecionado,
    expand: 'profissional($select=id,nome,conselhoNumero,especialidadeId)',
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
                  data-foto-base64="${prof.foto}"
                  src="assets/images/foto-medico.png" 
                  class="img-fluid rounded border foto-medico lazy-foto mx-auto mx-md-0 d-block" 
                  alt="Foto do médico" 
                  style="max-width: 90px; border: 1px solid #ccc !important;">
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
      
      

      // Carregar fotos base64
      // setTimeout(() => {
      //   document.querySelectorAll('.lazy-foto').forEach(imgEl => {
      //     const fotoBase64 = imgEl.getAttribute('data-foto-base64');
      //     if (fotoBase64) {
      //       const novaImg = new Image();
      //       novaImg.onload = () => {
      //         imgEl.src = `data:image/png;base64,${fotoBase64}`;
      //       };
      //       novaImg.src = `data:image/png;base64,${fotoBase64}`;
      //     }
      //   });
      // }, 100);

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
      }        
        
    });
  });  

/*###########################################################################################
    Selecionar datas agendamentos
############################################################################################*/ 
$('#unidadeSelect').on('select2:select', function () {

  // Zera select medico======================================
  const selectMedico = document.getElementById('medicoSelect');
  selectMedico.innerHTML = '<option value="">Todos os Médicos</option>';

  const idFilialSelecionada = document.getElementById('unidadeSelect').value;

  if(idFilialSelecionada){
    fn_selecionar_datas("selectUnidade","");   
  } 
});

$('#medicoSelect').on('select2:select', function () {
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

    fn_selecionar_datas("maisDatas",data_fim);   
    
  }
    
});

//Selecionar datas anterior========================================
$('#scrollLeft').on('click', function () {
  const scrollContainer = document.getElementById('dataScroll');
  const hasHorizontalScroll = scrollContainer.scrollWidth > scrollContainer.clientWidth;
  let carrega_datas = "N";

  if (hasHorizontalScroll) {
    const scrollLeft = scrollContainer.scrollLeft;

    // Verifica se está no início do scroll (com margem de 20px)
    if (scrollLeft <= 20) {
      carrega_datas = "S";
    }
  } else {
    carrega_datas = "S";
  }

  if (carrega_datas === "S") {
    const container = document.getElementById("datasAgendamento");
    const botoes = container.querySelectorAll(".data-btn");
    const primeiroBotao = botoes[0];
    const ultimoBotao = botoes[botoes.length - 1]; 

    const data_inicio = primeiroBotao.getAttribute("data-data-agenda");
    const data_fim = ultimoBotao.getAttribute("data-data-agenda");

    fn_selecionar_datas("menosDatas", data_inicio);  
  }
});


function fn_selecionar_datas(evento,data_inicio){  

    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    const token = JSON.parse(sessionStorage.getItem('token'));
    const id_usuario = usuario.id_usuario;
    const id_organizacao = token?.id_organizacao;
    const chave = token.chave;
    const idFilialSelecionada = document.getElementById('unidadeSelect').value;
    const idProfissionalSelecionado = document.getElementById('medicoSelect').value;   
    const lista_profissionais = []; // Opcional se precisar preencher select
    const lista_datas = [];
    const promises = [];

    //Carrega loader=============
    loader.style.display = 'flex'; 
    
    //Setar dom=================================================
    // document.getElementById('datasAgendamento').innerHTML = "";  
    document.getElementById("agendasMedicos").innerHTML = "";  

    //Lista agendamentos=====================================================================
    const parametrosAgendamentos = {
        id_usuario: id_usuario,
        id_organizacao: id_organizacao,
        id_filial: idFilialSelecionada,
        token: chave,
        expand: 'profissional($select=id,nome)'        
    };

    if(idProfissionalSelecionado){
        parametrosAgendamentos["id_profissional"] = idProfissionalSelecionado;
    }

    if(data_inicio){
        parametrosAgendamentos["evento"] = evento;
        parametrosAgendamentos["data_inicio"] = data_inicio;
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
            if(evento=="selectUnidade"){           
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

        // Volta scroll suavemente para o início
        const scrollContainer = document.getElementById('dataScroll');
        scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });

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
document.addEventListener('DOMContentLoaded', function () {
    const btnConfirmar = document.getElementById('btnConfirmarAgendamento');

    btnConfirmar.addEventListener('click', function () {

        Swal.fire({
          title: "Confirma o agendamento?",
          icon: "info",
          showDenyButton: false,
          showCancelButton: true,
          confirmButtonText: "Sim",
        }).then((result) => {
          if (result.isConfirmed) {

            // Dados do storage            
            const usuario = JSON.parse(sessionStorage.getItem('usuario'));
            const token = JSON.parse(sessionStorage.getItem('token'));              
            const id_organizacao = token.id_organizacao;
            const paciente = JSON.parse(sessionStorage?.getItem('paciente'));
            const id_usuario = usuario.id_usuario;
            const chave = token.chave;  
            const id_paciente = paciente?.id_paciente;
            const botaoSelecionado = document.querySelector('.horario-btn.selected');
            const id_agenda_md = botaoSelecionado ? botaoSelecionado.getAttribute('data-id-agenda-md') : null;
            var tipoAtendimento = document.querySelector('input[name="tipoAtendimento"]:checked').value; 
            var paciente_possui_consulta = "N";
            var consultas_agendadas = "";
            var id_agenda_md_agendado = "";

             //Carrega loader=============
              loader.style.display = 'flex'; 

              // Valida se o paciente tem agendamentos futuros
              const parametrosProximasConsultas = {
                id_usuario: id_usuario,
                token: chave,
                id_paciente: id_paciente,
                id_agenda_status: 2,
                orderby: "dataInicio asc, horaInicio asc"
              };

              fn_lista_consultas(parametrosProximasConsultas)
                .then(data => {

                  const proximas_consultas = data.value;

                  proximas_consultas.forEach(consultas => {

                    id_agenda_md_agendado = consultas?.id;
                    const data = formatarDataISO(consultas?.dataInicio);      
                    const hora = formatarHorarioISO(consultas?.horaInicio);

                      if(data){
                          paciente_possui_consulta = "S";
                          consultas_agendadas = `${data} às ${hora}`;
                      } 
                  });                   

                })
                .catch(error => {     

                    loader.style.display = 'none';

                })
                .finally(() => {

                   if(paciente_possui_consulta=="S"){

                       //Esconde o loader----------------------------------
                       loader.style.display = 'none'; // esconde o loader

                       Swal.fire({
                          icon: "info",
                          html: `Você já possui um agendamento para o dia ${consultas_agendadas}. <br> Deseja cancelar o agendamento?`,
                          showDenyButton: false,
                          showCancelButton: true,
                          confirmButtonText: "Sim, cancelar",
                          cancelButtonText: "Não, manter",
                        }).then((result) => {
                          if (result.isConfirmed) {

                                loader.style.display = 'flex'; // mostra o loader  

                                // Desmarcar consulta
                                const paramentrosDesmarcarConsultas = {
                                  id_usuario: id_usuario,
                                  token: chave,
                                  id: id_agenda_md_agendado,
                                  data: {
                                    "desmarcar": {
                                        "justificativa": "DESMARCADO PELO PACIENTE VIA AGENDAMENTO ONLINE"
                                    }
                                  }
                                };

                                fn_desmarcar_paciente(paramentrosDesmarcarConsultas)
                                  .then(data => { 
                                      const status = data?.status;
                                      const mensagem = data?.mensagem ?? data?.erro;

                                      if(status==200){

                                          Swal.fire({
                                              position: "center",
                                              icon: "success",
                                              title: "Agendamento desmarcado com sucesso!",
                                              showConfirmButton: false,
                                              timer: 1500
                                          });

                                          //Redireciona para a página meus-agendamentos
                                          setTimeout(function(){
                                              window.location.href = 'meus-agendamentos.html';
                                          }, 1500);
                                          

                                      }else{

                                        Swal.fire({
                                            icon: 'error',
                                            title: 'Erro',
                                            text: mensagem
                                          });                          
                                      }  
                                  })
                                  .catch(error => {
                                    console.error('Erro ao desmarcar consultas:', error.message || error);
                                  })
                                  .finally(() => {
                                    loader.style.display = 'none'; // Sempre oculta o loader
                                  });



                          } 
                      });

                   }else{

                          // Agendar paciente---------------------
                          const parametrosAgendamento = {
                            id_usuario: id_usuario,
                            id_organizacao: id_organizacao,
                            token: chave,
                            data: {
                              "id": id_agenda_md,
                              "titulo": "AGENDAMENTO ONLINE",
                              "pacienteId": id_paciente,
                              "observacoes": "AGENDAMENTO ONLINE",
                              "agendaStatusId": 2,
                              "online": "S"
                            }
                          };

                          //Tipo atendimento==========================
                          if (tipoAtendimento === "particular") {
                            parametrosAgendamento["data"]["tipoAtendimento"] = "1";
                          }
                          else if (tipoAtendimento === "convenio") {
                            parametrosAgendamento["data"]["tipoAtendimento"] = "2";
                            const convenioId = document.getElementById('convenioSelect').value;
                            parametrosAgendamento["data"]["convenioId"] = convenioId;
                          }

                          fn_agendar_paciente(parametrosAgendamento)
                            .then(data => {

                              const status = data?.status;
                              const mensagem = data?.mensagem ?? data?.erro;

                                if(status==200){

                                    Swal.fire({
                                        position: "center",
                                        icon: "success",
                                        title: "Agendamento realizado com sucesso!",
                                        showConfirmButton: false,
                                        timer: 1500
                                    });                                 
                                    
                                    //Redireciona para a página meus-agendamentos
                                      setTimeout(function(){
                                          window.location.href = 'meus-agendamentos.html';
                                      }, 1500);
                                    

                                }else{

                                  Swal.fire({
                                      icon: 'error',
                                      title: 'Erro',
                                      text: mensagem
                                    });                          
                                }                  
                              
                              //Esconde o loader----------------------------------
                              loader.style.display = 'none'; // esconde o loader
                            
                            })
                            .catch(error => {
                              //console.error('Erro ao agendar o paciente:', error.message);
                              loader.style.display = 'none';
                            }); 
                        
                   }                  
      
                    
                }); 
                
          } 
        });
    });
  });