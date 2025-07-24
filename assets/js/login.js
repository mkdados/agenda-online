// Limpa sessionStorage ao carregar a página de login
sessionStorage.clear();
limparIndexedDB(); // <--- limpa o IndexedDB ao carregar a página

const loader = document.getElementById('loader');

async function realizarLogin() {
  const identificador = document.getElementById('emailCpf').value.trim();
  const senha = document.getElementById('password').value;

  loader.style.display = 'flex';

  let id_usuario, cpf, chave, id_organizacao;

  // Bloco 1 - Login=====================================================
  try {
    const response = await fetch('api/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificador, senha })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.erro || 'Falha no login.');
    }

    sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
    sessionStorage.setItem('sessao', JSON.stringify(data.sessao));

    id_usuario = data.usuario.id_usuario;
    cpf = data.usuario.cpf;

  } catch (error) {
    loader.style.display = 'none';
    return Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: error.message || 'Erro ao realizar login.'
    });
  }

  // Bloco 2 - Gerar Token=============================================
  try {
    const parametrosToken = { identificador, id_usuario };
    const tokenData = await fn_gera_token(parametrosToken);

    id_organizacao = tokenData.id_organizacao;
    chave = tokenData.chave;
    const duracao = tokenData.duracao;

    sessionStorage.setItem('token', JSON.stringify({ id_organizacao, chave, duracao }));

  } catch (error) {
    loader.style.display = 'none';
    return Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: 'Erro ao gerar token. Tente novamente mais tarde.'
    });
  }

  // Bloco 3 - Listar Pacientes==========================================
  const usuario = JSON.parse(sessionStorage.getItem('usuario'));
  const token = JSON.parse(sessionStorage.getItem('token'));
  id_usuario = usuario?.id_usuario;
  chave = token?.chave;
  id_organizacao = token?.id_organizacao;
  cpf = usuario?.cpf;
  nome_usuario = usuario?.nome;
  dt_nascimento_usuario = usuario?.data_nascimento;
  email_usuario = usuario?.email;
  celular_usuario = usuario?.celular;

  try {
      const parametros = { id_usuario, token: chave, cpf };
      const pacientesData = await fn_lista_pacientes(parametros);
      const listaPacientes = pacientesData.value;

      // Verifica se algum paciente da lista tem o CPF buscado
      const normalizarCPF = cpf => cpf?.replace(/\D/g, '');

      const pacienteEncontrado = listaPacientes.find(
        p => normalizarCPF(p.documento?.cpf) === normalizarCPF(cpf)
      );

      if (pacienteEncontrado) {
        const dados_paciente = {
          id_paciente: pacienteEncontrado?.id,
          id_convenio: pacienteEncontrado?.convenio?.id,
          numero_carteirinha: pacienteEncontrado?.convenio?.numCarteira
        };

        const data_paciente = Object.fromEntries(
          Object.entries(dados_paciente).filter(([_, v]) => v != null && v !== '')
        );

        sessionStorage.setItem('paciente', JSON.stringify(data_paciente));
        //console.log("Paciente encontrado:", pacienteEncontrado);
      } else {
        throw new Error("Paciente não encontrado");
      }
    } catch (error) {
      //console.warn("Paciente não encontrado. Iniciando cadastro...");

      // Cadastra o paciente
      const response = await fn_cadastrar_paciente({
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

      if (response.erro) {
        //console.error("Erro ao cadastrar paciente:", response.erro);
        return;
      }

      //console.log("Paciente cadastrado com sucesso:", response);

      // Após cadastro, chama novamente a função para obter e salvar o paciente
      const parametros = { id_usuario, token: chave, cpf };
      const pacientesData = await fn_lista_pacientes(parametros);
      const listaPacientes = pacientesData.value;

      const pacienteNovo = listaPacientes.find(p => p.cpf === cpf);

      if (pacienteNovo) {
        const dados_paciente = {
          id_paciente: pacienteNovo?.id,
          id_convenio: pacienteNovo?.convenio?.id,
          numero_carteirinha: pacienteNovo?.convenio?.numCarteira
        };

        const data_paciente = Object.fromEntries(
          Object.entries(dados_paciente).filter(([_, v]) => v != null && v !== '')
        );

        sessionStorage.setItem('paciente', JSON.stringify(data_paciente));
        //console.log("Paciente gravado no sessionStorage após cadastro.");
      } else {
        //console.error("Paciente cadastrado mas não encontrado na nova listagem.");
      }
    }


  // try {
  //   const parametros = { id_usuario, token: chave, cpf };
  //   const pacientesData = await fn_lista_pacientes(parametros);
  //   const listaPacientes = pacientesData.value;

  //   listaPacientes.forEach(paciente => {
  //     const dados_paciente = {
  //       id_paciente: paciente?.id,
  //       id_convenio: paciente?.convenio?.id,
  //       numero_carteirinha: paciente?.convenio?.numCarteira
  //     };

  //     const data_paciente = Object.fromEntries(
  //       Object.entries(dados_paciente).filter(([_, v]) => v != null && v !== '')
  //     );

  //     sessionStorage.setItem('paciente', JSON.stringify(data_paciente));
  //   });

  // } catch (error) {
  //   const dados_paciente = {
  //     id_paciente: null,
  //     id_convenio: null,
  //     numero_carteirinha: null
  //   };
  //   sessionStorage.setItem('paciente', JSON.stringify(dados_paciente));
  // }

  // Bloco 4 - Agenda Config===================================================
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
  
  // Bloco 6 - Carrega foto do profissional    
  try {
    const parametros = {
      id_usuario,
      token: chave,
      id_profissional: profissional_id
    };
    fn_lista_profissionais(parametros); // se necessário processar resultado, adicione lógica aqui
  } catch (erro) {
    // console.warn("Erro ao carregar foto:", erro);
  }

  // Redireciona após todas as etapas
  window.location.href = 'home.html';
}

// Clique no botão
document.getElementById('btnLogin').addEventListener('click', realizarLogin);

// Pressionar Enter no formulário
document.getElementById('loginForm').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    realizarLogin();
  }
});

// Função para salvar dados no IndexedDB
async function salvarAgendaConfigIndexedDB(profissionaisAgendaConfig) {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction('agendaConfig', 'readwrite');
    const store = tx.objectStore('agendaConfig');

    const dados = {
      id: 'config1', // Chave primária fixa
      profissionaisAgendaConfig
    };

    store.put(dados);

    tx.oncomplete = () => {
      db.close();
    };

    tx.onerror = () => {
      console.error('Erro ao salvar no IndexedDB:', tx.error);
    };

  } catch (error) {
    console.error('Erro ao abrir IndexedDB:', error);
  }
}

async function limparIndexedDB() {
  try {
    const db = await openIndexedDB();
    const storeNames = Array.from(db.objectStoreNames);

    const tx = db.transaction(storeNames, 'readwrite');
    storeNames.forEach(storeName => {
      tx.objectStore(storeName).clear();
    });

    tx.oncomplete = () => {
      db.close();
      // console.log('IndexedDB limpo com sucesso.');
    };

    tx.onerror = () => {
      console.error('Erro ao limpar IndexedDB:', tx.error);
    };

  } catch (error) {
    console.error('Erro ao abrir IndexedDB para limpeza:', error);
  }
}



