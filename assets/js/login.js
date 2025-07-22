// Limpa sessionStorage ao carregar a página de login
sessionStorage.clear();
limparIndexedDB(); // <--- limpa o IndexedDB ao carregar a página

const loader = document.getElementById('loader');

async function realizarLogin() {
  const identificador = document.getElementById('emailCpf').value.trim();
  const senha = document.getElementById('password').value;

  loader.style.display = 'flex';

  let id_usuario, cpf, chave, id_organizacao;

  // Bloco 1 - Login
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

  // Bloco 2 - Gerar Token
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

  // Bloco 3 - Listar Pacientes
  try {
    const parametros = { id_usuario, token: chave, cpf };
    const pacientesData = await fn_lista_pacientes(parametros);
    const listaPacientes = pacientesData.value;

    listaPacientes.forEach(paciente => {
      const dados_paciente = {
        id_paciente: paciente?.id,
        id_convenio: paciente?.convenio?.id,
        numero_carteirinha: paciente?.convenio?.numCarteira
      };

      const data_paciente = Object.fromEntries(
        Object.entries(dados_paciente).filter(([_, v]) => v != null && v !== '')
      );

      sessionStorage.setItem('paciente', JSON.stringify(data_paciente));
    });

  } catch (error) {
    const dados_paciente = {
      id_paciente: null,
      id_convenio: null,
      numero_carteirinha: null
    };
    sessionStorage.setItem('paciente', JSON.stringify(dados_paciente));
  }

  // Bloco 4 - Agenda Config
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







// // Limpa sessionStorage ao carregar a página de login
// sessionStorage.clear();

// const loader = document.getElementById('loader');

// async function realizarLogin() {
//   const identificador = document.getElementById('emailCpf').value.trim();
//   const senha = document.getElementById('password').value;

//   loader.style.display = 'flex'; // mostra o loader

//   try {
//     const response = await fetch('api/login.php', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ identificador, senha })
//     });

//     const data = await response.json();

//     if (response.ok) {  

//       //Seta sessionStorage com os dados do usuário
//       sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
//       sessionStorage.setItem('sessao', JSON.stringify(data.sessao));
//       const id_usuario = data.usuario.id_usuario;
//       const cpf = data.usuario.cpf;

//       const parametrosToken = {
//         identificador: identificador,
//         id_usuario: id_usuario       
//       };
      
//       //Resgata o token===============
//       fn_gera_token(parametrosToken)
//         .then(data => {

//           const id_organizacao = data.id_organizacao;
//           const chave = data.chave;
//           const duracao = data.duracao;          

//           //Grava o token no sessionStorage
//           sessionStorage.setItem('token', JSON.stringify({
//               id_organizacao: id_organizacao,
//               chave: chave,
//               duracao: duracao
//           }));   

//           const parametros = {
//             id_usuario: id_usuario,
//             token: chave,
//             cpf: cpf
//           };

//           //Pega dados do paciente
//           fn_lista_pacientes(parametros)
//             .then(data => {
//               const listaPacientes = data.value;

//               listaPacientes.forEach(paciente => {
                  
//                   const dados_paciente = {
//                     id_paciente: paciente?.id,
//                     id_convenio: paciente?.convenio?.id,
//                     numero_carteirinha: paciente?.convenio?.numCarteira
//                   };

//                   // Verifica se o paciente tem dados válidos
//                   const data_paciente = Object.fromEntries(
//                     Object.entries(dados_paciente).filter(([_, v]) => v != null && v !== '')
//                   );

//                   //Grava o paciente no sessionStorage
//                   sessionStorage.setItem('paciente', JSON.stringify(data_paciente));

//               });               

//               //Redireciona para a página home
//               window.location.href = 'home.html';   
//             })
//             .catch(error => {

//               const dados_paciente = {
//                     id_paciente: null,
//                     id_convenio: null,
//                     numero_carteirinha: null
//                   };

//               // Verifica se o paciente tem dados válidos
//               const data_paciente = Object.fromEntries(
//                 Object.entries(dados_paciente).filter(([_, v]) => v != null && v !== '')
//               );

//               //Grava o paciente no sessionStorage
//               sessionStorage.setItem('paciente', JSON.stringify(data_paciente));

//               //Redireciona para a página home
//               window.location.href = 'home.html';

//             });
               

//         })
//         .catch(error => {
//           loader.style.display = 'none'; // esconde o loader
//           Swal.fire({
//             icon: 'error',
//             title: 'Erro',
//             text: 'Erro inesperado. Tente novamente mais tarde.'
//           });
//         });     
    
//     } else {
//       loader.style.display = 'none'; // esconde o loader
//       Swal.fire({
//         icon: 'error',
//         title: 'Erro',
//         html: data?.erro
//       });
//     }
//   } catch (error) {
//     loader.style.display = 'none'; // esconde o loader
//     Swal.fire({
//       icon: 'error',
//       title: 'Erro',
//       text: 'Erro inesperado. Tente novamente mais tarde.'
//     });
//   }
// }

// // Clique no botão
// document.getElementById('btnLogin').addEventListener('click', realizarLogin);

// // Pressionar Enter no formulário
// document.getElementById('loginForm').addEventListener('keydown', function(e) {
//   if (e.key === 'Enter') {
//     e.preventDefault();
//     realizarLogin();
//   }
// });
