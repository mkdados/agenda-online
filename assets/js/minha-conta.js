/*###########################################################################################
     Editar dados da minha conta
############################################################################################*/ 

const btnEditar = document.getElementById('btnEditar');
  const btnCancelar = document.getElementById('btnCancelar');

  // Guarda valores originais para cancelar
  let valoresOriginais = {};

  btnEditar.addEventListener('click', function() {
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

      // Aqui você pode fazer o envio do formulário ou requisição AJAX
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