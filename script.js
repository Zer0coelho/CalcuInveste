let ativos = [];
let chart;
let editIndex = -1;

const tabelasPorTipo = document.getElementById("tabelasPorTipo");
const formAtivo = document.getElementById("formAtivo");
const formInvestir = document.getElementById("formInvestir");
const valorInvestir = document.getElementById("valorInvestir");
const sugestao = document.getElementById("sugestao");
const ctx = document.getElementById("grafico").getContext("2d");
const btnLimpar = document.getElementById("limparAtivos");
const btnAdicionar = document.getElementById("btnAdicionar");

// Adicionar ou editar ativo
formAtivo.addEventListener("submit", e => {
    e.preventDefault();
    const nome = document.getElementById("nome").value.trim();
    const tipo = document.getElementById("tipo").value;
    const quantidade = parseFloat(document.getElementById("quantidade").value);
    const precoMedio = parseFloat(document.getElementById("precoMedio").value);
    const precoAtual = parseFloat(document.getElementById("precoAtual").value);
    const meta = parseFloat(document.getElementById("meta").value);
    const total = (quantidade * precoMedio).toFixed(2);

    const duplicado = ativos.some((a, idx) => idx !== editIndex && a.nome.toLowerCase() === nome.toLowerCase() && a.tipo === tipo);
    if (duplicado) {
        alert("Ativo já cadastrado!");
        return;
    }

    const novoAtivo = { nome, tipo, quantidade, precoMedio, precoAtual, meta, total };

    if (editIndex >= 0) {
        ativos[editIndex] = novoAtivo;
        editIndex = -1;
        btnAdicionar.textContent = "Adicionar";
    } else {
        ativos.push(novoAtivo);
    }

    formAtivo.reset();
    atualizarTabelas();
    atualizarGrafico();
});

// Limpar ativos
btnLimpar.addEventListener("click", () => {
    ativos = [];
    tabelasPorTipo.innerHTML = "";
    sugestao.innerHTML = "";
    editIndex = -1;
    btnAdicionar.textContent = "Adicionar";
    if (chart) chart.destroy();
});

// Atualiza tabelas separadas por tipo
function atualizarTabelas() {
    tabelasPorTipo.innerHTML = "";
    const tipos = [...new Set(ativos.map(a => a.tipo))];
    tipos.forEach(tipo => {
        const ativosDoTipo = ativos.filter(a => a.tipo === tipo);
        const div = document.createElement("div");
        div.innerHTML = `<h3>${tipo}</h3>`;
        const tabela = document.createElement("table");
        tabela.innerHTML = `
      <thead>
        <tr>
          <th>Nome</th>
          <th>Qtd</th>
          <th>Preço Médio (R$)</th>
          <th>Preço Atual (R$)</th>
          <th>Total Investido (R$)</th>
          <th>Meta (%)</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${ativosDoTipo.map((a, idx) => `
          <tr>
            <td>${a.nome}</td>
            <td>${a.quantidade}</td>
            <td>R$ ${a.precoMedio.toFixed(2)}</td>
            <td>R$ ${a.precoAtual.toFixed(2)}</td>
            <td>R$ ${a.total}</td>
            <td>${a.meta.toFixed(2)}%</td>
            <td><button onclick="editarAtivo(${ativos.indexOf(a)})">Editar</button></td>
          </tr>
        `).join("")}
      </tbody>
    `;
        div.appendChild(tabela);
        tabelasPorTipo.appendChild(div);
    });
}

// Editar ativo
function editarAtivo(idx) {
    const a = ativos[idx];
    document.getElementById("nome").value = a.nome;
    document.getElementById("tipo").value = a.tipo;
    document.getElementById("quantidade").value = a.quantidade;
    document.getElementById("precoMedio").value = a.precoMedio;
    document.getElementById("precoAtual").value = a.precoAtual;
    document.getElementById("meta").value = a.meta;
    btnAdicionar.textContent = "Salvar";
    editIndex = idx;
}

// Atualiza gráfico
function atualizarGrafico() {
    const labels = ativos.map(a => a.nome);
    const data = ativos.map(a => parseFloat(a.total));

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "pie",
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: ["#1a73e8", "#34a853", "#fbbc05", "#ea4335", "#9c27b0", "#ff5722", "#00bcd4"]
            }]
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const valor = context.raw;
                            const totalCarteira = data.reduce((a, b) => a + b, 0);
                            const perc = ((valor / totalCarteira) * 100).toFixed(2);
                            return `${context.label}: R$ ${valor.toFixed(2)} (${perc}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Rebalanceamento com preço atual - quantidade inteira
formInvestir.addEventListener("submit", e => {
    e.preventDefault();
    const valor = parseFloat(valorInvestir.value);
    if (isNaN(valor) || valor <= 0) {
        alert("Digite um valor válido.");
        return;
    }

    const totalCarteira = ativos.reduce((sum, a) => sum + parseFloat(a.total), 0);
    let msg = "<h3>Sugestão de Compra:</h3>";

    ativos.forEach(a => {
        const proporcao = a.total / totalCarteira;
        const investir = valor * proporcao;
        const qtdComprar = Math.floor(investir / a.precoAtual);
        if (qtdComprar >= 1) {
            msg += `<p>${a.nome} (${a.tipo}): Comprar ${qtdComprar} cotas (≈ R$ ${(qtdComprar * a.precoAtual).toFixed(2)})</p>`;
        }
    });

    sugestao.innerHTML = msg;
});
