 /*Máscaras de entrada====================================================================*/
$(document).ready(function () {
    Inputmask("999.999.999-99").mask("#cpf");
    Inputmask("99/99/9999").mask("#dataNascimento");
    Inputmask("(99) 99999-9999").mask("#celular");
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

function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
    let resto = soma % 11;
    if (parseInt(cpf[9]) !== (resto < 2 ? 0 : 11 - resto)) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
    resto = soma % 11;
    if (parseInt(cpf[10]) !== (resto < 2 ? 0 : 11 - resto)) return false;

    return true;
}

function validarData(data) {
  if (!data) return false;

  const cleaned = data.trim().replace(/\D/g, ""); // remove tudo que não for número

  if (cleaned.length !== 8) return false; // deve ter 8 dígitos: ddmmyyyy

  const dia = parseInt(cleaned.substr(0, 2), 10);
  const mes = parseInt(cleaned.substr(2, 2), 10);
  const ano = parseInt(cleaned.substr(4, 4), 10);

  if (ano < 1900 || ano > new Date().getFullYear()) return false;
  if (mes < 1 || mes > 12) return false;

  const diasNoMes = new Date(ano, mes, 0).getDate(); // pega último dia do mês
  return dia >= 1 && dia <= diasNoMes;
}

function validarCelular(numero) {
  const regex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/;
  return regex.test(numero);
}

function validarNome(nome) {
  const partes = nome.trim().split(/\s+/);
  return partes.length >= 2 && partes.every(p => p.length >= 2);
}

// Função para adicionar ou remover classe de erro
function toggleInvalidClass(element, isValid) {
  if (!isValid) {
    element.classList.add("is-invalid");
  } else {
    element.classList.remove("is-invalid");
  }
}

// Função para formatar horario iso===========
function formatarHorarioISO(isoDuration) {
   // Pega as horas (opcional)
  const horasMatch = isoDuration.match(/(\d+)H/);
  // Pega os minutos (opcional)
  const minutosMatch = isoDuration.match(/(\d+)M/);

  // Se não tiver horas, assume "00"
  const horas = horasMatch ? horasMatch[1].padStart(2, '0') : '00';
  // Se não tiver minutos, assume "00"
  const minutos = minutosMatch ? minutosMatch[1].padStart(2, '0') : '00';

  return `${horas}:${minutos}`;
}