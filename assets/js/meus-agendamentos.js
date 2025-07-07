 
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
    condicional_data: "ge",
    orderby: "dataInicio asc, horaInicio asc"
  };

  fn_lista_consultas(parametrosProximasConsultas)
    .then(data => { 

        const proximas_consultas = data.value;

        proximas_consultas.forEach(consultas => {   
          
          const id_agenda_md = consultas?.id;
          const profissional = consultas?.profissional?.nome;
          const iniciais = pegarIniciais(profissional);
          const data = formatarDataISO(consultas?.dataInicio);      
          const hora = formatarHorarioISO(consultas?.horaInicio);
          const unidade = consultas?.clinica.nomeCompleto;

            html_consultas += `<div class="col-12 col-md-6">
                                <div class="card card-top-border proximas-consultas shadow-sm">
                                  <div class="card-body">
                                    <div class="doctor-info mb-2">
                                      <div class="circle-initials d-none d-md-flex">${iniciais}</div>
                                      <div>
                                        <h5 class="doctor-name mb-0">${profissional}</h5>
                                        <p class="card-text card-text-muted mb-1">Dermatologista</p>
                                      </div>
                                    </div>
                                    <p class="card-text card-text-muted mb-1">
                                      <i class="fa-solid fa-location-dot icon-orange me-2"></i>${unidade}
                                    </p>
                                    <p class="card-text card-text-muted mb-1">
                                      <i class="fas fa-calendar-alt icon-orange me-2"></i>${data}
                                    </p>
                                    <p class="card-text card-text-muted">
                                      <i class="fas fa-clock icon-orange me-2"></i>${hora}
                                    </p>
                                  </div>
                                  <div class="card-footer bg-transparent border-top-0">
                                    <button class="btn btn-sm btn-padrao w-100 mb-2 btn-desmarcar" id="${id_agenda_md}">Cancelar Consulta</button>
                                  </div>
                                </div>
                              </div>
                              <div class="col-md-6 col-0"></div>`;
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
          condicional_data: "lt",
          orderby: "dataInicio desc, horaInicio desc"
        };

        fn_lista_consultas(parametrosProximasConsultas)
          .then(data => { 

              const proximas_consultas = data.value;

              proximas_consultas.forEach(consultas => {   
                
                const id_agenda_md = consultas?.id;
                const profissional = consultas?.profissional?.nome;
                const iniciais = pegarIniciais(profissional);
                const data = formatarDataISO(consultas?.dataInicio);      
                const hora = formatarHorarioISO(consultas?.horaInicio);
                const unidade = consultas?.clinica.nomeCompleto;

                  html_consultas += `<div class="col-12 col-md-6">
                                      <div class="card card-top-border historico-consultas shadow-sm">
                                        <div class="card-body">
                                          <div class="doctor-info mb-2">
                                            <div class="circle-initials d-none d-md-flex">${iniciais}</div>
                                            <div>
                                              <h5 class="doctor-name mb-0">${profissional}</h5>
                                              <p class="card-text card-text-muted mb-1">Dermatologista</p>
                                            </div>
                                          </div>
                                          <p class="card-text card-text-muted mb-1">
                                            <i class="fa-solid fa-location-dot icon-gray me-2"></i>${unidade}
                                          </p>
                                          <p class="card-text card-text-muted mb-1">
                                            <i class="fas fa-calendar-alt icon-gray me-2"></i>${data}
                                          </p>
                                          <p class="card-text card-text-muted">
                                            <i class="fas fa-clock icon-gray me-2"></i>${hora}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    <div class="col-md-6 col-0"></div>`;
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
  

           