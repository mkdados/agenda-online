/*###########################################################################################
     Carrossel de Planos - Auto Scroll e Clonagem
############################################################################################*/ 
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('carousel-planos');
  const scrollSpeed = 1;
  const scrollInterval = 10;
  const manualScrollAmount = 270;

  // Salva os itens originais como HTML para clonagem futura
  const originalHTML = container.innerHTML;

  // Função para clonar os itens no final
  function addClones() {
    container.insertAdjacentHTML('beforeend', originalHTML);
  }

  // Inicialmente, clona uma vez para começar com conteúdo dobrado
  addClones();

  function autoScroll() {
    container.scrollLeft += scrollSpeed;

    // Se estiver perto do final, adiciona novos clones
    if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 100) {
      addClones();
    }
  }

  let autoScrollInterval = setInterval(autoScroll, scrollInterval);

  window.scrollCarousel = function(direction) {
    clearInterval(autoScrollInterval); // pausa o auto scroll

    // Se estiver no início e for voltar, pula pro fim
    if (direction === -1 && container.scrollLeft <= 0) {
      container.scrollLeft = container.scrollWidth - container.clientWidth;
    }

    container.scrollBy({
      left: manualScrollAmount * direction,
      behavior: 'smooth'
    });

    setTimeout(() => {
      // Se passou do final, volta para o início (opcional)
      if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 100) {
        addClones();
      }
      autoScrollInterval = setInterval(autoScroll, scrollInterval); // retoma o auto scroll
    }, 500);
  };
});


/*###########################################################################################
     Logout
############################################################################################*/ 
function logout() {
  // Limpa sessionStorage
  sessionStorage.clear();

  // Limpa localStorage se usar
  localStorage.clear();

  // Limpa IndexedDB (se usar)
  limparIndexedDB().then(() => {
    // Redireciona para login
    window.location.href = 'index.html';
  });
}