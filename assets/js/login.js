// Limpa sessionStorage e IndexedDB ao carregar a página de login
sessionStorage.clear();
limparIndexedDB();

const loader = document.getElementById('loader');

async function realizarLogin() {
  loader.style.display = 'flex';

  const identificador = document.getElementById('emailCpf').value.trim();
  const senha = document.getElementById('password').value;

  let id_usuario, id_cliente, cpf, chave, id_organizacao;

  // --- Bloco 1: Login do usuário ---
  try {
    const response = await fetch('api/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificador, senha })
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data?.erro || 'Falha no login.');

    sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
    sessionStorage.setItem('sessao', JSON.stringify(data.sessao));

    id_usuario = data.usuario.id_usuario;
    id_cliente = data.usuario.id_cliente,
    cpf = data.usuario.cpf;

  } catch (error) {
    loader.style.display = 'none';
    return Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: error.message || 'Erro ao realizar login.'
    });
  }

  // --- Bloco 2: Gerar token ---
  try {
    const parametrosToken = { identificador, id_usuario, id_cliente };
    const tokenData = await fn_gera_token(parametrosToken);

    id_organizacao = tokenData.id_organizacao;
    chave = tokenData.chave;

    sessionStorage.setItem('token', JSON.stringify({
      id_organizacao,
      chave,
      duracao: tokenData.duracao
    }));

  } catch (error) {
    loader.style.display = 'none';
    return Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: 'Erro ao gerar token. Tente novamente mais tarde.'
    });
  }

  // --- Bloco 3: Buscar e/ou cadastrar paciente ---
  try {
    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    const token = JSON.parse(sessionStorage.getItem('token'));

    id_usuario = usuario?.id_usuario;
    chave = token?.chave;
    id_organizacao = token?.id_organizacao;
    cpf = usuario?.cpf;
    const nome_usuario = usuario?.nome;
    const dt_nascimento_usuario = usuario?.data_nascimento;
    const email_usuario = usuario?.email;
    const celular_usuario = usuario?.celular;

    const parametrosPacientes = { id_usuario, token: chave, cpf };

    // Função para normalizar CPF removendo caracteres não numéricos
    const normalizarCPF = cpf => cpf?.replace(/\D/g, '');

    // Lista pacientes
    let pacientesData = await fn_lista_pacientes(parametrosPacientes);
    let listaPacientes = pacientesData.value;

    // Tenta encontrar paciente pelo CPF
    let pacienteEncontrado = listaPacientes.find(
      p => normalizarCPF(p.documento?.cpf) === normalizarCPF(cpf)
    );

    if (!pacienteEncontrado) {
      // Se não encontrou, tenta cadastrar paciente
      const responseCadastro = await fn_cadastrar_paciente({
        token: chave,
        data: {
          organizacaoId: id_organizacao,
          filialId: id_organizacao,
          cpf: cpf,
          nome: nome_usuario,
          dataNascimento: dt_nascimento_usuario,
          telefone: celular_usuario,
          email: email_usuario
        }
      });

      if (responseCadastro.erro) {
        loader.style.display = 'none';
        return Swal.fire({
          icon: 'error',
          title: 'Erro ao cadastrar paciente',
          text: responseCadastro.erro || 'Não foi possível cadastrar o paciente.'
        });
      }

      // Busca pacientes novamente após cadastro
      pacientesData = await fn_lista_pacientes(parametrosPacientes);
      listaPacientes = pacientesData.value;

      pacienteEncontrado = listaPacientes.find(
        p => normalizarCPF(p.documento?.cpf) === normalizarCPF(cpf)
      );

      if (!pacienteEncontrado) {
        loader.style.display = 'none';
        return Swal.fire({
          icon: 'error',
          title: 'Paciente não encontrado',
          text: 'Não foi possível encontrar ou cadastrar o paciente. Login cancelado.'
        });
      }
    }

    // Salva dados do paciente no sessionStorage
    const dados_paciente = {
      id_paciente: pacienteEncontrado?.id,
      id_convenio: pacienteEncontrado?.convenio?.id,
      numero_carteirinha: pacienteEncontrado?.convenio?.numCarteira
    };

    const data_paciente = Object.fromEntries(
      Object.entries(dados_paciente).filter(([_, v]) => v != null && v !== '')
    );

    sessionStorage.setItem('paciente', JSON.stringify(data_paciente));

  } catch (error) {
    loader.style.display = 'none';
    return Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: 'Serviço indisponível, tente novamente mais tarde.'
    });
  }

  // --- Bloco 4: Listar agenda config ---
  let id_agenda_config = "";
  let profissional_id = "";
  let profissionaisAgendaConfig = [];

  try {
    const parametrosAgendaConfig = {
      id_usuario,
      id_organizacao,
      token: chave
    };

    const dataAgendaConfig = await fn_lista_agenda_config(parametrosAgendaConfig);

    if (dataAgendaConfig?.value?.length > 0) {
      id_agenda_config = dataAgendaConfig.value.map(item => item.id).join(",");
      profissional_id = dataAgendaConfig.value.map(item => item.profissionalId).join(",");

      dataAgendaConfig.value.forEach(item => {
        const profissional = item.profissional;
        if (profissional?.id && profissional?.nome) {
          const jaExiste = profissionaisAgendaConfig.some(p => p.id === profissional.id);
          if (!jaExiste) {
            profissionaisAgendaConfig.push({
              id: profissional.id,
              id_filial: item.filialId,
              nome: profissional.nome,
              id_agenda_config: id_agenda_config
            });
          }
        }
      });

      // Salvar no IndexedDB
      await salvarAgendaConfigIndexedDB(profissionaisAgendaConfig);
    }

  } catch (err) {
    loader.style.display = 'none';
    console.error("Erro ao listar agendamentos:", err);
  }

  // --- Bloco 5: Carregar foto do profissional ---
  try {
    const parametrosFoto = {
      id_usuario,
      token: chave,
      id_profissional: profissional_id
    };
    fn_lista_profissionais(parametrosFoto);
  } catch (erro) {
    // Pode ignorar ou logar
  }  

  // Redireciona para home após sucesso
  window.location.href = 'home.html';
}

// Eventos para botão e Enter
document.getElementById('btnLogin').addEventListener('click', realizarLogin);
document.getElementById('loginForm').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    realizarLogin();
  }
});

// IndexedDB utils

async function salvarAgendaConfigIndexedDB(profissionaisAgendaConfig) {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction('agendaConfig', 'readwrite');
    const store = tx.objectStore('agendaConfig');

    const dados = {
      id: 'config1',
      profissionaisAgendaConfig
    };

    store.put(dados);

    tx.oncomplete = () => db.close();
    tx.onerror = () => console.error('Erro ao salvar no IndexedDB:', tx.error);

  } catch (error) {
    console.error('Erro ao abrir IndexedDB:', error);
  }
}

