 
/*###########################################################################################
    Próximas consultas
############################################################################################*/ 

  let html_consultas = "";
  loader.style.display = 'flex'; // mostra o loader       

  // Listar próximas consultas
  const parametrosProximasConsultas = {
    id_usuario: id_usuario,
    token: chave,
    id_paciente: id_paciente,
    condicional_data: "maior_igual",
    orderby: "dataInicio asc, horaInicio asc"
  };

  fn_lista_consultas(parametrosProximasConsultas)
    .then(data => { 

        const proximas_consultas = data.value;

        // Remove duplicados pelo id
        const consultasUnicas = proximas_consultas.filter(
          (consulta, index, self) =>
            index === self.findIndex(c => c.id === consulta.id)
        );

        consultasUnicas.forEach(consultas => {  
          
          const id_agenda_md = consultas?.id;
          const profissionalId = consultas?.profissional?.id;
          const profissional = consultas?.profissional?.nome ? consultas?.profissional?.nome : "";
          const iniciais = pegarIniciais(profissional);
          const data = formatarDataISO(consultas?.dataInicio);      
          const hora = formatarHorarioISO(consultas?.horaInicio);
          const unidade = consultas?.filial.nomeCompleto;
          var status = consultas?.agendaStatus?.descricao;
          var btnCancelar = "";

          //Endereço------------------------
          let endereco = "";
          let endereco_logradouro = (consultas.filial.endereco) ? consultas.filial?.endereco?.logradouro : "";
          let endereco_numero =  (consultas.filial.endereco) ? consultas.filial?.endereco?.numero : "";
          let endereco_complemento =  (consultas.filial.endereco) ? consultas.filial?.endereco?.complemento : "";
          let endereco_bairro =  (consultas.filial.endereco) ? consultas.filial?.endereco?.bairro : "";
          let endereco_municipio =  (consultas.filial.endereco) ? consultas.filial?.endereco?.municipio : "";
          let endereco_uf =  (consultas.filial.endereco) ? consultas.filial?.endereco?.uf : "";
          let endereco_maps = "";
          let endereco_link = "";

          endereco += (endereco_logradouro) ? endereco_logradouro : "";
          endereco += (endereco_numero) ? ", "+endereco_numero : "";
          endereco += (endereco_complemento) ? ", "+endereco_complemento : "";
          endereco += (endereco_bairro) ? ", "+endereco_bairro : "";
          //endereco += (endereco_municipio) ? ", "+endereco_municipio : "";
          //endereco += (endereco_uf) ? " - "+endereco_uf : "";

          if(endereco){
            endereco_maps = `https://www.google.com/maps/search/?api=1&query=${endereco_logradouro},+${endereco_numero},+${endereco_municipio},+${endereco_uf}`;
            endereco_link = `<a href="${endereco_maps}" target="_blank" rel="noopener" style="color:#000000;">${endereco}</a>`;
          }

          // Verifica o status
          if(status == "ATENDIDO"){
              btnCancelar = `<p class="card-text card-text-muted mt-2">
                                           <span class="badge bg-success">${status}</span>
                                          </p>`;
          }
          else{
              btnCancelar = `<div class="card-footer bg-transparent border-top-0">
                                    <button class="btn btn-sm btn-padrao w-100 mb-2 btn-desmarcar" id="${id_agenda_md}">Cancelar Consulta</button>
                                  </div>`;
          }


          html_consultas += `<div class="col-12 col-md-6">
            <div class="card card-top-border proximas-consultas shadow-sm">
              <div class="card-body">
                
                <!-- Foto + nome -->
                <div class="d-flex align-items-start gap-4 px-3 flex-wrap flex-md-nowrap doctor-info">
                  <img 
                    data-profissional-id="${profissionalId}"
                    src="assets/images/medicos/${profissionalId}.png?v=${new Date().getTime()}" 
                    onerror="this.onerror=null;this.src='assets/images/medicos/foto-medico.png';"
                    class="foto-redonda img-fluid border lazy-foto mx-auto mx-md-0 d-block" 
                    alt="Foto do médico">

                  <div class="flex-grow-1">
                    <h5 class="doctor-name mb-0">${profissional}</h5>
                    <p class="card-text card-text-muted mb-1">Dermatologista</p>
                  </div>
                </div>

                <!-- Unidade + Endereço -->
                <div class="mt-3">
                  <p class="card-text fw-bold mb-1">
                    <i class="fa-solid fa-location-dot icon-orange me-2"></i>${unidade}
                  </p>
                  <p class="card-text card-text-muted small">
                    ${endereco_link}
                  </p>
                </div>

                <!-- Data -->
                <p class="card-text card-text-muted mb-1 mt-2">
                  <i class="fas fa-calendar-alt icon-orange me-2"></i>${data}
                </p>

                <!-- Hora -->
                <p class="card-text card-text-muted">
                  <i class="fas fa-clock icon-orange me-2"></i>${hora}
                </p>

                ${btnCancelar}

              </div>                                  
            </div>
          </div>
          <div class="col-md-6 col-0"></div>
          `;

        });       
        
    })
    .catch(error => {
      console.error('Erro ao carregar consultas:', error.message || error);

      if(!html_consultas){
          html_consultas = `<div class="alert" role="alert" style="background-color:#f1e2df;color:#d47d48;">Nenhuma consulta agendada</div>`;            
      }
    })
    .finally(() => {
      
      if(!html_consultas){
          html_consultas = `<div class="alert" role="alert" style="background-color:#f1e2df;color:#d47d48;">Nenhuma consulta agendada</div>`;            
      }

      document.getElementById("card-proximas-consultas").innerHTML =  html_consultas;

      // Sempre oculta o loader
      loader.style.display = 'none'; 
    });  


/*###########################################################################################
    Histórico de consultas
  ############################################################################################*/ 
    
  document.addEventListener("DOMContentLoaded", function () {
    const historicoTab = document.getElementById("historico-tab");

    historicoTab.addEventListener("click", function () {

        let html_consultas = "";
        loader.style.display = 'flex'; // mostra o loader       

        // Listar próximas consultas
        const parametrosProximasConsultas = {
          id_usuario: id_usuario,
          token: chave,
          id_paciente: id_paciente,
          condicional_data: "menor_que", 
          orderby: "dataInicio desc, horaInicio desc"
        };

        fn_lista_consultas(parametrosProximasConsultas)
          .then(data => { 

              const proximas_consultas = data.value;

              // Remove duplicados pelo id
              const consultasUnicas = proximas_consultas.filter(
                (consulta, index, self) =>
                  index === self.findIndex(c => c.id === consulta.id)
              );

              consultasUnicas.forEach(consultas => {   
                
                const id_agenda_md = consultas?.id;
                const profissionalId = consultas?.profissional?.id;
                const profissional = consultas?.profissional?.nome ? consultas?.profissional?.nome : "";
                const iniciais = pegarIniciais(profissional);
                const data = formatarDataISO(consultas?.dataInicio);      
                const hora = formatarHorarioISO(consultas?.horaInicio);
                const unidade = consultas?.filial.nomeCompleto;
                var status = consultas?.agendaStatus?.descricao;
                var classeStatus = "";

                 //Endereço------------------------
                  let endereco = "";
                  let endereco_logradouro = (consultas.filial.endereco) ? consultas.filial?.endereco?.logradouro : "";
                  let endereco_numero =  (consultas.filial.endereco) ? consultas.filial?.endereco?.numero : "";
                  let endereco_complemento =  (consultas.filial.endereco) ? consultas.filial?.endereco?.complemento : "";
                  let endereco_bairro =  (consultas.filial.endereco) ? consultas.filial?.endereco?.bairro : "";
                  let endereco_municipio =  (consultas.filial.endereco) ? consultas.filial?.endereco?.municipio : "";
                  let endereco_uf =  (consultas.filial.endereco) ? consultas.filial?.endereco?.uf : "";
                  let endereco_maps = "";
                  let endereco_link = "";

                  endereco += (endereco_logradouro) ? endereco_logradouro : "";
                  endereco += (endereco_numero) ? ", "+endereco_numero : "";
                  endereco += (endereco_complemento) ? ", "+endereco_complemento : "";
                  endereco += (endereco_bairro) ? ", "+endereco_bairro : "";
                  //endereco += (endereco_municipio) ? ", "+endereco_municipio : "";
                  //endereco += (endereco_uf) ? " - "+endereco_uf : "";

                  if(endereco){
                    endereco_maps = `https://www.google.com/maps/search/?api=1&query=${endereco_logradouro},+${endereco_numero},+${endereco_municipio},+${endereco_uf}`;
                    endereco_link = `<a href="${endereco_maps}" target="_blank" rel="noopener" style="color:#000000;">${endereco}</a>`;
                  } 


                // Verifica o status da consulta e define a classe CSS
                if(status == "DESMARCADO" || status == "CANCELADO"){
                    status = "DESMARCADO";
                    classeStatus = "bg-danger";
                }
                else if(status == "ATENDIDO"){
                    classeStatus = "bg-success";
                }
                else{
                    status = "AGENDADO";
                    classeStatus = "bg-primary";
                }
                
                html_consultas += `<div class="col-12 col-md-6">
                  <div class="card card-top-border historico-consultas shadow-sm">
                    <div class="card-body">
                      
                      <!-- Foto + nome -->
                      <div class="d-flex align-items-start gap-4 px-3 flex-wrap flex-md-nowrap doctor-info">
                        <img 
                          data-profissional-id="${profissionalId}"
                          src="assets/images/medicos/${profissionalId}.png?v=${new Date().getTime()}" 
                          onerror="this.onerror=null;this.src='assets/images/medicos/foto-medico.png';"
                          class="foto-redonda img-fluid border lazy-foto mx-auto mx-md-0 d-block" 
                          alt="Foto do médico">

                        <div class="flex-grow-1">
                          <h5 class="doctor-name mb-0">${profissional}</h5>
                          <p class="card-text card-text-muted mb-1">Dermatologista</p>
                        </div>
                      </div>

                      <!-- Unidade + Endereço -->
                      <div class="mt-3">
                        <p class="card-text fw-bold mb-1">
                          <i class="fa-solid fa-location-dot icon-gray me-2"></i>${unidade}
                        </p>
                        <p class="card-text card-text-muted small">
                          ${endereco_link}
                        </p>
                      </div>

                      <!-- Data -->
                      <p class="card-text card-text-muted mb-1 mt-2">
                        <i class="fas fa-calendar-alt icon-gray me-2"></i>${data}
                      </p>

                      <!-- Hora -->
                      <p class="card-text card-text-muted">
                        <i class="fas fa-clock icon-gray me-2"></i>${hora}
                      </p>

                      <!-- Status -->
                      <p class="card-text card-text-muted mt-2">
                        <span class="badge ${classeStatus}">${status}</span>
                      </p>

                    </div>
                  </div>
                </div>
                <div class="col-md-6 col-0"></div>
                `;

              });       
              
          })
          .catch(error => {
            console.error('Erro ao carregar consultas:', error.message || error);

            if(!html_consultas){
                html_consultas = `<div class="alert" role="alert" style="background-color:#f1e2df;color:#d47d48;">Nenhuma consulta agendada</div>`;            
            }
          })
          .finally(() => {
            
            if(!html_consultas){
                html_consultas = `<div class="alert" role="alert" style="background-color:#f1e2df;color:#d47d48;">Nenhuma consulta agendada</div>`;            
            }

            document.getElementById("card-historico-consultas").innerHTML =  html_consultas;

            // Sempre oculta o loader
            loader.style.display = 'none'; 
          });  
    });
  });


/*###########################################################################################
     Desmarcar consultas
  ############################################################################################*/ 
document.addEventListener('click', function (event) {
  if (event.target && event.target.classList.contains('btn-desmarcar')) {
    
    Swal.fire({
          title: "Deseja realmente desmarcar a consulta?",
          icon: "info",
          showDenyButton: false,
          showCancelButton: true,
          confirmButtonText: "Sim",
        }).then((result) => {
          if (result.isConfirmed) { 

                const id_agenda_md = event.target.id; // o ID da consulta
                
                loader.style.display = 'flex'; // mostra o loader  

                // Desmarcar consulta
                const paramentrosDesmarcarConsultas = {
                  id_usuario: id_usuario,
                  token: chave,
                  id: id_agenda_md,
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
  }
});
  

           