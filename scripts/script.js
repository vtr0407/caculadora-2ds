const screen = document.getElementById('answer');                  
const buttons = document.querySelectorAll('.calc-btn');            
const historyBtn = document.getElementById('history-btn');          
const historyPanel = document.getElementById('history-panel');      // Painel deslizante do histórico
const historyList = document.getElementById('history-list');        // Container onde as entradas do histórico serão renderizadas
const closeHistory = document.getElementById('close-history');      // Botão para fechar o painel de histórico
const clearHistory = document.getElementById('clear-history');      // Botão para limpar o histórico salvo
const themeToggle = document.getElementById('theme-toggle');        // Botão/alternador de tema (claro/escuro)

// Theme toggle logic
function setTheme(mode) {                                           // Função para aplicar e persistir o tema
  document.documentElement.classList.toggle('dark', mode === 'dark'); // Adiciona/remove a classe 'dark' em <html> com base no modo
  themeToggle.setAttribute('aria-pressed', mode === 'dark');        // Atualiza estado acessível do botão (true quando escuro)
  localStorage.setItem('theme', mode);                              // Persiste a escolha do usuário no localStorage
}
setTheme(localStorage.getItem('theme') || 'light');                 // Na carga, aplica o tema salvo; se não existir, usa 'light'
themeToggle.onclick = () => {                                       // Ao clicar no toggle de tema
  const newMode = document.documentElement.classList.contains('dark') ? 'light' : 'dark'; // Decide o próximo modo com base no estado atual
  setTheme(newMode);                                                // Aplica e salva o novo tema
};

// History logic
function getHistory() {                                             // Retorna o histórico do localStorage
  return JSON.parse(localStorage.getItem('calcHistory') || '[]');   // Lê a chave 'calcHistory' ou devolve array vazio
}
function saveHistory(expr, res) {                                   // Salva uma nova entrada de histórico
  let hist = getHistory();                                          // Obtém o array atual
  hist.push({ expr, res });                                         // Adiciona objeto com expressão e resultado
  if (hist.length > 50) hist.shift();                               // Mantém no máximo 50 itens removendo o mais antigo
  localStorage.setItem('calcHistory', JSON.stringify(hist));        // Persiste o array atualizado
}
function renderHistory() {                                          // Renderiza o histórico na UI
  const hist = getHistory().slice().reverse();                      // Copia e inverte para mostrar o mais recente primeiro
  historyList.innerHTML = hist.length                               // Define o HTML do container com base se há itens
    ? hist.map(item => `<div class="flex justify-between p-3 rounded bg-gray-100 dark:bg-gray-700">
          <span>${item.expr}</span>
          <span class="${item.res < 0 ? 'text-red-500' : 'text-green-500'} font-bold">${item.res}</span>
          </div>`).join('')                                         // Para cada item, cria um bloco com expr e res (cores por sinal)
    : `<p class="text-gray-500">No history yet</p>`;                // Mensagem quando não há histórico
}
historyBtn.onclick = () => {                                        // Ao clicar no botão de histórico
  renderHistory();                                                  // Gera a lista atualizada
  historyPanel.classList.remove('translate-y-full', 'sm:translate-x-full'); // Tira classes que escondem o painel (mostra)
};
closeHistory.onclick = () => {                                      // Ao clicar para fechar o histórico
  historyPanel.classList.add('translate-y-full', 'sm:translate-x-full');   // Reaplica classes que escondem o painel
};
clearHistory.onclick = () => {                                      // Ao clicar para limpar histórico
  localStorage.removeItem('calcHistory');                           // Remove do localStorage
  renderHistory();                                                  // Re-renderiza (mostrará "No history yet")
};

// Calculator (BODMAS)
function calculate(expr) {                                          // Função pura que calcula o valor de uma expressão
  try {                                                             // Protege contra erros de sintaxe/execução
    const tokens = expr.match(/(\d+(\.\d+)?|[+\-*/%()])/g);         // Tokeniza: números decimais e operadores/parênteses
    const prec = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2 };        // Tabela de precedência (maior valor = maior prioridade)
    const output = [], ops = [];                                    // Pilha/array de saída (RPN) e pilha de operadores
    tokens.forEach(t => {                                           // Converte para Notação Polonesa Reversa (RPN)
      if (!isNaN(t)) output.push(parseFloat(t));                    // Números vão direto para a saída
      else if (t in prec) {                                         // Se for operador
        while (ops.length && prec[ops[ops.length - 1]] >= prec[t])  // Enquanto topo da pilha tiver op com precedência >=
          output.push(ops.pop());                                   // Move operadores da pilha para a saída
        ops.push(t);                                                // Empilha operador atual
      } else if (t === '(') ops.push(t);                            // Abre parêntese vai para a pilha
      else if (t === ')') {                                         // Fecha parêntese: desempilha até encontrar '('
        while (ops[ops.length - 1] !== '(') output.push(ops.pop()); // Move operadores para saída até abrir parêntese
        ops.pop();                                                  // Remove o '(' da pilha
      }
    });
    while (ops.length) output.push(ops.pop());                      // Ao final, move operadores restantes para a saída

    const stack = [];                                               // Pilha para avaliar a RPN
    output.forEach(t => {                                           // Percorre cada token na RPN
      if (typeof t === 'number') stack.push(t);                     // Números empilhados
      else {                                                        // Encontrou operador: aplicar em dois operandos
        const b = stack.pop(), a = stack.pop();                     // Desempilha b (direita) e a (esquerda)
        if (typeof a === 'undefined' || typeof b === 'undefined')   // Se faltar operando, expressão malformada
          throw Error('Malformed');                                  // Dispara erro para cair no catch
        if (t === '+') stack.push(a + b);                           // Soma
        if (t === '-') stack.push(a - b);                           // Subtração
        if (t === '*') stack.push(a * b);                           // Multiplicação
        if (t === '/') stack.push(a / b);                           // Divisão (sem checar divisão por zero aqui)
        if (t === '%') stack.push(a % b);                           // Módulo (resto)
      }
    });
    return stack[0];                                                // Resultado final (topo da pilha)
  } catch {                                                         // Em qualquer erro na avaliação
    return 'Err';                                                   // Retorna string 'Err' para a UI tratar
  }
}

// Button click and keyboard support
buttons.forEach(b => {                                              // Para cada botão da calculadora
  b.onclick = () => {                                                // Define handler de clique
    const val = b.value;                                            // Lê o valor associado ao botão (ex.: '7', '+', '=', 'C')
    if (val === '=') {                                              // Caso usuário clique em '='
      const res = calculate(screen.value);                          // Calcula o resultado da expressão atual
      if (!isNaN(res)) {                                            // Se resultado é numérico válido
        saveHistory(screen.value, res);                             // Salva no histórico (expr + res)
        screen.value = Number.isInteger(res) ? res : res.toFixed(2);// Formata: inteiro sem casas; decimal com 2 casas
      } else {                                                      // Se houve erro
        screen.value = 'Err';                                       // Mostra erro na tela
      }
    } else if (val === 'C') {                                       // Se botão for 'C' (clear)
      screen.value = '';                                            // Limpa a tela
    } else {                                                        // Qualquer outro botão (número/operador/ponto/parênteses)
      screen.value += val;                                          // Concatena o valor ao final da expressão
    }
  };
});

document.addEventListener('keydown', e => {                         // Suporte a teclado global
  if (/[0-9+\-*/%.()]/.test(e.key)) {                               // Se tecla é um dígito, operador, ponto ou parênteses
    screen.value += e.key;                                          // Adiciona à expressão
    return;                                                         // Sai cedo (não processa outros atalhos)
  }
  if (e.key === 'Enter' || e.key === '=') {                         // Enter ou '=' via teclado executa cálculo
    const res = calculate(screen.value);                            // Avalia expressão
    if (!isNaN(res)) {                                              // Resultado válido?
      saveHistory(screen.value, res);                               // Salva no histórico
      screen.value = Number.isInteger(res) ? res : res.toFixed(2);  // Formata resultado
    } else {                                                        // Erro na expressão
      screen.value = 'Err';                                         // Exibe erro
    }
    e.preventDefault();                                             // Evita comportamento padrão (ex.: submit)
  }
  if (e.key === 'Backspace') {                                      // Tecla Backspace
    screen.value = screen.value.slice(0, -1);                       // Remove último caractere da expressão
    e.preventDefault();                                             // Evita navegação/voltar página
  }
  if (e.key.toLowerCase() === 'd') {                                // Atalho 'd' para alternar tema
    const newMode = document.documentElement.classList.contains('dark') ? 'light' : 'dark'; // Decide próximo modo
    setTheme(newMode);                                              // Aplica tema
    e.preventDefault();                                             // Evita efeitos colaterais
  }
  if (e.key.toLowerCase() === 'h') {                                // Atalho 'h' para abrir/fechar histórico
    historyPanel.classList.contains('translate-y-full') || historyPanel.classList.contains('sm:translate-x-full') // Checa se está escondido
      ? historyPanel.classList.remove('translate-y-full', 'sm:translate-x-full') // Se escondido, mostra
      : historyPanel.classList.add('translate-y-full', 'sm:translate-x-full');   // Se visível, esconde
    e.preventDefault();                                             // Previna ação padrão
  }
  if (e.key.toLowerCase() === 'c') {                                // Atalho 'c' para limpar tela
    screen.value = '';                                              // Limpa a expressão
    e.preventDefault();                                             // Evita outras ações
  }
});
