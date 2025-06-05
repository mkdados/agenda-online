 /*Máscaras de entrada====================================================================*/
$(document).ready(function () {
  setTimeout(() => {
    Inputmask("999.999.999-99").mask("#cpf");
    Inputmask("99/99/9999").mask("#dataNascimento");
    Inputmask("(99) 99999-9999").mask("#celular");
  }, 300);
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
