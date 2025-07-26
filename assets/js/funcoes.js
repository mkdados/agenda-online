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

function formatarDataISO(dataISO) {
  const dataUtc = new Date(dataISO);
  dataUtc.setHours(dataUtc.getHours() + 3); // Corrige o UTC-3 (horário do Brasil)
  
  const dia = String(dataUtc.getDate()).padStart(2, '0');
  const mes = String(dataUtc.getMonth() + 1).padStart(2, '0');
  const ano = dataUtc.getFullYear();
  
  return `${dia}/${mes}/${ano}`;
}

function pegarIniciais(nomeCompleto) {
  if (!nomeCompleto) return '';

  const preposicoes = ['de', 'da', 'do', 'das', 'dos', 'e'];
  
  const palavras = nomeCompleto
    .trim()
    .split(' ')
    .filter(palavra => palavra && !preposicoes.includes(palavra.toLowerCase()));

  const iniciais = palavras.slice(0, 2).map(p => p[0].toUpperCase()).join('');
  return iniciais;
}


function isBase64(str) {
  if (typeof str !== 'string') return false;

  str = str.trim();

  // Protege contra string "null"
  if (!str || str.toLowerCase() === 'null') return false;

  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

  return base64Regex.test(str);
}


// Função auxiliar para abrir o banco de dados e garantir a store
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AgendaDB', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Cria o objectStore se não existir
      if (!db.objectStoreNames.contains('agendaConfig')) {
        db.createObjectStore('agendaConfig', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}


// Função para limpar indexdb=============================================================
  async function limparIndexedDB() {
  try {
    const db = await openIndexedDB();
    const storeNames = Array.from(db.objectStoreNames);
    const tx = db.transaction(storeNames, 'readwrite');

    storeNames.forEach(storeName => {
      tx.objectStore(storeName).clear();
    });

    tx.oncomplete = () => db.close();
    tx.onerror = () => console.error('Erro ao limpar IndexedDB:', tx.error);

  } catch (error) {
    console.error('Erro ao abrir IndexedDB para limpeza:', error);
  }
}

// Função para ver a senha=============================================================

  // Ativa o toggle de exibir/ocultar senha para todos os campos com .toggle-password
  document.querySelectorAll('.toggle-password').forEach(function (element) {
    element.addEventListener('click', function () {
      const inputId = this.getAttribute('data-target');
      const input = document.getElementById(inputId);
      const icon = this.querySelector('i');

      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });


// Função para voltar para o topo=============================================================

 const btnVoltarTopo = document?.getElementById('btnVoltarTopo');
  document.body.addEventListener('scroll', function () {
    if (document.body.scrollTop > 100) {
      btnVoltarTopo.style.display = 'block';
    } else {
      btnVoltarTopo.style.display = 'none';
    }
  });

  btnVoltarTopo.addEventListener('click', function () {
    document.body.scrollTop = 0; // Para Safari
    document.documentElement.scrollTop = 0; // Para Chrome, Firefox, IE
  });

