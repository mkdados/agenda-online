
/*###########################################################################################
     Carrega dados da minha conta
############################################################################################*/ 

const parametrosAcesso = {
  id_usuario: id_usuario
};

loader.style.display = 'flex'; // mostra o loader 

fn_lista_usuario(parametrosAcesso)
.then(data => {
  const usuario = data.usuario;
  const cpf = usuario.cpf;
  const nome = usuario.nome;
  const data_nascimento = usuario.data_nascimento;
  const celular = usuario.celular;
  const email = usuario.email;
  
  //Cpf
  document.getElementById("cpfLabel").innerHTML = cpf;
  //Nome
  document.getElementById("nomeLabel").innerHTML = nome;
  //Data Nascimento
  document.getElementById("dataNascimentoLabel").innerHTML = data_nascimento;
  //Celular
  document.getElementById("celularLabel").innerHTML = celular;
  //Email
  document.getElementById("emailLabel").innerHTML = email;

  // esconde o loader
  loader.style.display = 'none';

})
.catch(error => {
  //console.error('Erro ao carregar usuarios:', error.message);
  // esconde o loader
  loader.style.display = 'none';
});

/*###########################################################################################
     Editar dados da minha conta
############################################################################################*/ 
const btnEditar = document.getElementById('btnEditar');
const btnCancelar = document.getElementById('btnCancelar');

// Guarda valores originais para cancelar
let valoresOriginais = {};

  btnEditar.addEventListener('click', function() {    

    const form = document.getElementById("minhaContaForm");
    const isEditing = this.dataset.editing === 'true';
    const campos = ['cpf', 'nome', 'dataNascimento', 'celular', 'email'];    

    if (!isEditing) {
      // Salvar valores originais para possível cancelamento
      campos.forEach(campo => {
        valoresOriginais[campo] = document.getElementById(campo + 'Label').textContent;
      });

      // Entrar em modo edição
      campos.forEach(campo => {
        document.getElementById(campo + 'Label').classList.add('d-none');
        const input = document.getElementById(campo);
        input.classList.remove('d-none');
        // Preencher input com o valor atual do span (útil para edição)
        input.value = valoresOriginais[campo];
      });

      this.innerHTML = '<i class="fa fa-save me-2"></i> Salvar';
      this.dataset.editing = 'true';

      btnCancelar.classList.remove('d-none'); // mostrar botão cancelar      

    } else {

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Coleta automática dos dados do formulário
      const formData = new FormData(form);
      const dados = Object.fromEntries(formData.entries());

      // Limpeza e formatação
      dados.email = dados.email.toLowerCase();

      // Valida Nome
      if (!validarNome(dados.nome)) {
        Swal.fire({ icon: "warning", title: "Nome incompleto", text: "Digite seu nome completo (nome e sobrenome)." });
        toggleInvalidClass(form.nome, false);
        form.nome.focus();
        return;
      } 

      // Valida Data de Nascimento
      if (!validarData(dados.dataNascimento)) {
        Swal.fire({ icon: "warning", title: "Data de nascimento inválida", text: "Use o formato dd/mm/aaaa." });
        toggleInvalidClass(form.dataNascimento, false);
        form.dataNascimento.focus();
        return;
      }

      // Valida Celular
      if (!validarCelular(dados.celular)) {
        Swal.fire({ icon: "warning", title: "Celular inválido", text: "Insira um número com DDD." });
        toggleInvalidClass(form.celular, false);
        form.celular.focus();
        return;
      }

      // Função para formatar data dd/mm/aaaa → yyyy-mm-dd
      function formatarDataParaISO(data) {
        const [dia, mes, ano] = data.split('/');
        return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      }
      dados.dataNascimento = formatarDataParaISO(dados.dataNascimento);     
      

      //Atualiza usuario=================================================
      const parametrosAcesso = {
          id_usuario: id_usuario,
          nome: dados.nome,
          data_nascimento: dados.dataNascimento,
          celular: dados.celular,
          email: dados.email,
          atualizar_senha: "N"
      };

      loader.style.display = 'flex'; // mostra o loader 

      fn_atualizar_usuario(parametrosAcesso)
      .then(data => {

        // esconde o loader
        loader.style.display = 'none';

        if (data.erro) {

            Swal.fire({
              toast: true,
              icon: 'error',
              title: data.erro,
              position: 'bottom-end',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
              didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
              }
            });


        }else{

            //Atualiza session storage
            const usuarioStr = sessionStorage.getItem('usuario');
            if (usuarioStr) {
              const usuario = JSON.parse(usuarioStr);

              // Atualiza os campos desejados
              usuario.nome = dados.nome;
              usuario.email = dados.email;

              // Salva de volta no sessionStorage
              sessionStorage.setItem('usuario', JSON.stringify(usuario));
            }

            // Atualiza nome e e-mail no menu lateral
            document.querySelector('#user-section .name').textContent = dados.nome;
            document.querySelector('#user-section .email').textContent = dados.email;

            // Salvar as alterações (aqui só atualiza os spans)
            campos.forEach(campo => {
              const input = document.getElementById(campo);
              const span = document.getElementById(campo + 'Label');
              span.textContent = input.value;
              span.classList.remove('d-none');
              input.classList.add('d-none');
            });

            this.innerHTML = '<i class="fa fa-pen me-2"></i> Editar';
            this.dataset.editing = 'false';

            btnCancelar.classList.add('d-none'); // esconder botão cancelar

            Swal.fire({
              toast: true,
              icon: 'success',
              title: 'Dados atualizado com sucesso',
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

      })
      .catch(error => {
        //console.error('Erro ao carregar usuarios:', error.message);
        // esconde o loader
        loader.style.display = 'none';

          Swal.fire({
            toast: true,
            icon: 'error',
            title: 'Erro ao atualizar os dados',
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.addEventListener('mouseenter', Swal.stopTimer)
              toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
          });
      });
    }
  });

  btnCancelar.addEventListener('click', function() {
    const campos = ['cpf', 'nome', 'dataNascimento', 'celular', 'email'];

    // Voltar para modo visualização, descartando mudanças
    campos.forEach(campo => {
      const span = document.getElementById(campo + 'Label');
      const input = document.getElementById(campo);
      span.textContent = valoresOriginais[campo]; // restaura valor original
      span.classList.remove('d-none');
      input.classList.add('d-none');
    });

    btnEditar.innerHTML = '<i class="fa fa-pen me-2"></i> Editar';
    btnEditar.dataset.editing = 'false';

    this.classList.add('d-none'); // esconde botão cancelar
  });

/*###########################################################################################
    Alterar senha da minha conta
############################################################################################*/ 
const btnSalvarNovaSenha = document.getElementById('btnSalvarNovaSenha');

  btnSalvarNovaSenha.addEventListener('click', function() { 
      const form = document.getElementById("alteracaoSenhaForm");

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

       // Coleta automática dos dados do formulário
      const formData = new FormData(form);
      const dados = Object.fromEntries(formData.entries());

      //Valida se a senha é menor que 8
      if (dados.novaSenha.length < 8) {
        Swal.fire({ icon: "warning", title: "Senha fraca", text: "A senha deve conter no mínimo 8 caracteres." });
        form.novaSenha.focus();
        return;
      }

      //Valida se as senhas são diferentes
      if (dados.novaSenha !== dados.confirmarNovaSenha) {
        Swal.fire({ icon: "warning", title: "Senhas diferentes", text: "As senhas não coincidem." });
        form.confirmarNovaSenha.focus();
        return;
      }

      //Atualiza usuario=================================================
      const parametrosAcesso = {
          id_usuario: id_usuario,
          nova_senha: dados.novaSenha,
          senha: dados.senhaAtual,
          atualizar_senha: "S"
      };

      loader.style.display = 'flex'; // mostra o loader 

      fn_atualizar_usuario(parametrosAcesso)
      .then(data => {

        // esconde o loader
        loader.style.display = 'none';
        

        if (data.erro) {

            Swal.fire({
              toast: true,
              icon: 'error',
              title: data.erro,
              position: 'bottom-end',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
              didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
              }
            });


        }else{

            form.reset();

            Swal.fire({
              toast: true,
              icon: 'success',
              title: 'Senha atualizada com sucesso',
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

      })
      .catch(error => {
        //console.error('Erro ao carregar usuarios:', error.message);
        // esconde o loader
        loader.style.display = 'none';

          Swal.fire({
            toast: true,
            icon: 'error',
            title: 'Erro ao atualizar a senha',
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.addEventListener('mouseenter', Swal.stopTimer)
              toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
          });
      });
  });