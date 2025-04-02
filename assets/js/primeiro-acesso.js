$( document ).ready(function() {

    /*Máscaras de entrada====================================================================*/
    //$('#cpf').inputmask('999.999.999-99'); // Aplica a máscara de CPF
    $('#dataNascimento').inputmask('99/99/9999'); // Aplica a máscara de data de nascimento
    $('#celular').inputmask('(99) 99999-9999'); // Aplica a máscara de celular
    
    $('#cpf').inputmask('999.999.999-99', {
        autoUnmask: true
    });

    /*Input text Caixa Alta====================================================================*/
    document.querySelectorAll('input[type="text"]').forEach(function(input) {
        input.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
        });
    });
  
    
});


   