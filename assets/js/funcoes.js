 /*Máscaras de entrada====================================================================*/
$(document).ready(function() { 
  $('#cpf').inputmask('999.999.999-99', { autoUnmask: true }); // Aplica a máscara de CPF
  $('#dataNascimento').inputmask('99/99/9999', { autoUnmask: true }); // Aplica a máscara de data de nascimento
  $('#celular').inputmask('(99) 99999-9999', { autoUnmask: true }); // Aplica a máscara de celular
});

/*Input text Caixa Alta====================================================================*/
document.querySelectorAll('input[type="text"]').forEach(function(input) {
    input.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
});

/*Input email Caixa baixa====================================================================*/
const emailInput = document.getElementById('email');
if (emailInput) {
emailInput.addEventListener('input', function () {
    this.value = this.value.toLowerCase();
});
}

const emailCpf = document.getElementById('emailCpf');
if (emailCpf) {
emailCpf.addEventListener('input', function () {
    this.value = this.value.toLowerCase();
});
}
