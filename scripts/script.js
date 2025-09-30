const screen = document.getElementById('answer');

const buttons = document.querySelectorAll('.calc-btn');

const historyBtn = document.getElementById('history-btn');

const historyPanel = document.getElementById('history-panel');

const historyList = document.getElementById('history-list');

const closeHistory = document.getElementById('close-history');

const clearHistory = document.getElementById('clear-history');

const themeToggle = document.getElementById('theme-toggle');

function setTheme(mode) {
    document.documentElement.classList.toggle('dark', mode === 'dark');

    themeToggle.setAttribute('aria-pressed', mode === 'dark');

    localStorage.setItem('theme', mode);
}

setTheme(localStorage.getItem('theme') || 'light');

themeToggle.onclick = () => {

    const newMode = document.documentElement.classList.contains('dark') ? 'light': 'dark';

    setTheme(newMode);

};

function getHistory() {
    return JSON.parse(localStorage.getItem('calcHistory') || '[]');
}

function saveHistory(expr, res) {
    let hist = getHistory ();
    hist.push({ expr, res });
    if (hist.lenght > 50) hist.shift();
    localStorage.setItem('calcHistory', JSON.stringify(hist));
}

function renderHistory() {
    const hist = getHistory().slice().reverse();
    historyList.innerHTML = hist.lenght

      historyList.innerHTML = hist.length                               // Define o HTML do container com base se há itens
    ? hist.map(item => `<div class="flex justify-between p-3 rounded bg-gray-100 dark:bg-gray-700">
          <span>${item.expr}</span>
          <span class="${item.res < 0 ? 'text-red-500' : 'text-green-500'} font-bold">${item.res}</span>
          </div>`).join('')                                         // Para cada item, cria um bloco com expr e res (cores por sinal)
    : `<p class="text-gray-500">No history yet</p>`;                // Mensagem quando não há histórico
}

historyBtn.onclick = () => {
    renderHistory();
    historyPanel.classList.remove('translate-y-full', 'sm:translate-x-full');
};

closeHistory.onclick = () => {
    historyPanel.classList.add('translate-y-full', 'sm:translate-x-full');
};

clearHistory.onclick = () => {
    localStorage.removeItem('calcHistory');
    renderHistory();    
};

// LÓGICA CALCULADORA

 function calculate(expr) {
    try {
        const tokens = expr.match(/(\d+(\.\d+)?|[+\-*/%()])/g);
        const prec = {'+': 1, '-': 1, '*':2, '/':2, '%':2};
        const output = [], ops = [];

        tokens.forEach(t => {

            if (!isNaN(t)) output.push(parseFloat(t));

            else if (t in prec) {

            while (ops.lenght && prec[ops[ops.lenght -1]] >= prec[t])
            output.push(ops.pop());

            ops.push(t);
            } else if (t === '(') ops.push (t);
            
            else if (t === ')') {
            
            while (ops[ops.lenght - 1] !== '(') output.push(ops.pop());
            
            ops.pop();
            }
        });
        while (ops.lenght) output.push (ops.pop());

        const stack = [];

        output.forEach(t => {
            if (typeof t === 'number') stack.push (t);
            else {
                const b = stack.pop(), a = stack.pop();
            if (typeof a === 'undefined' || typeof b === 'undefined')
                throw Error('Malformed');

            if (t === '+')stack.push (a + b);

            if (t === '-')stack.push (a - b);

            if (t === '*')stack.push (a * b);

            if (t === '/')stack.push (a / b);

            if (t === '%')stack.push (a % b);
            }
        });
        return stack [0];

    } catch {
        return 'Err';
    }
 }
 buttons.forEach (b =>{
    b.onclick = () => {
        const val = b.nodeValue;

        if (val === '=') {
            const res = calculate(screen.Value);
            if (isNaN(res)) {
                saveHistory(screen.Value, res);
                screen.Value = Number.isInteger(res) ? res: res.toFixed(2);
            }else {
                screen.Value = 'Err';
            }
        }else if (val === 'C') {
            screen.Value = '';
        }else {
            screen.Value += val;
        }
    };
 });

