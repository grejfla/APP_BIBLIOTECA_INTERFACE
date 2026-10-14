const API_URL = "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formRelatorio");
    const tipo = document.getElementById("tipoRelatorio");
    const btnImprimir = document.getElementById("btnImprimir");
    const mensagem = document.getElementById("mensagemRelatorio");
    const area = document.getElementById("areaRelatorio");
    const titulo = document.getElementById("tituloRelatorio");
    const resumo = document.getElementById("resumoRelatorio");
    const cabecalho = document.getElementById("cabecalhoRelatorio");
    const corpo = document.getElementById("corpoRelatorio");

    async function buscar(rota) {
        const resp = await fetch(`${API_URL}${rota}`);
        if (!resp.ok) throw new Error(`Erro HTTP ${resp.status} em ${rota}`);
        const dados = await resp.json();
        if (!Array.isArray(dados)) throw new Error(`${rota} não retornou uma lista`);
        return dados;
    }

    // Converte "2026-10-13" ou data ISO/GMT em dd/mm/aaaa
    function formatarData(valor) {
        if (!valor) return "—";
        const d = new Date(valor);
        if (isNaN(d)) return String(valor);
        return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
    }

    function hojeISO() {
        return new Date().toISOString().slice(0, 10);
    }

    // Cada relatório define: título, colunas e como obter as linhas.
    const relatorios = {
        abertos: {
            titulo: "Empréstimos em aberto",
            colunas: ["Código", "Livro", "Usuário", "Tipo", "Empréstimo", "Previsão", "Situação"],
            async linhas() {
                const dados = await buscar("/emprestimos");
                const hoje = hojeISO();
                return dados
                    .filter(e => !e.DataDevolucaoReal)
                    .map(e => {
                        const previsao = new Date(e.PrevisaoDevolucao)
                            .toISOString().slice(0, 10);
                        return [
                            e.idEmprestimo,
                            e.NomeLivro || "Não identificado",
                            e.NomeUsuario,
                            e.TipoUsuario,
                            formatarData(e.DataEmprestimo),
                            formatarData(e.PrevisaoDevolucao),
                            previsao < hoje ? "ATRASADO" : "No prazo"
                        ];
                    });
            }
        },

        livros: {
            titulo: "Livros cadastrados",
            colunas: ["Código", "Título", "Autor", "Editora", "Ano", "ISBN", "Categoria", "Qtd.", "Status"],
            async linhas() {
                const dados = await buscar("/livros");
                return dados.map(l => [
                    l.idLivro, l.NomeLivro, l.AutorLivro, l.EditoraLivro,
                    l.AnoPublicacaoLivro, l.ISBN_Livro, l.Categoria_Livro,
                    l.QuantidadeLivro, l.StatusLivros
                ]);
            }
        },

        usuarios: {
            titulo: "Usuários cadastrados",
            colunas: ["Código", "Nome", "Tipo", "Identificação", "Turma", "Contato"],
            async linhas() {
                const [alunos, funcionarios] = await Promise.all([
                    buscar("/aluno"),
                    buscar("/funcionario")
                ]);
                return [
                    ...alunos.map(a => [
                        a.idAluno, a.NomeAluno, "Aluno",
                        a.MatriculaAluno, a.TurmaAluno, a.ContatoAluno
                    ]),
                    ...funcionarios.map(f => [
                        f.idfuncionario, f.NomeFuncionario, "Funcionário",
                        f.RegistroFuncionario, "—", "—"
                    ])
                ];
            }
        }
    };

    function celula(tag, texto) {
        const el = document.createElement(tag);
        el.textContent = texto ?? "—";
        return el;
    }

    function desenhar(rel, linhas) {
        titulo.textContent = rel.titulo;
        resumo.textContent =
            `Gerado em ${new Date().toLocaleString("pt-BR")} — ` +
            `Total de registros: ${linhas.length}`;

        cabecalho.replaceChildren();
        const trHead = document.createElement("tr");
        rel.colunas.forEach(c => trHead.appendChild(celula("th", c)));
        cabecalho.appendChild(trHead);

        corpo.replaceChildren();
        if (linhas.length === 0) {
            const tr = document.createElement("tr");
            const td = celula("td", "Nenhum registro encontrado.");
            td.colSpan = rel.colunas.length;
            tr.appendChild(td);
            corpo.appendChild(tr);
        } else {
            linhas.forEach(l => {
                const tr = document.createElement("tr");
                l.forEach(v => tr.appendChild(celula("td", v)));
                corpo.appendChild(tr);
            });
        }

        area.hidden = false;
        btnImprimir.hidden = false;
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();
        const rel = relatorios[tipo.value];
        mensagem.textContent = "Gerando relatório...";

        try {
            const linhas = await rel.linhas();
            desenhar(rel, linhas);
            mensagem.textContent = "";
        } catch (erro) {
            console.error("Erro no relatório:", erro);
            area.hidden = true;
            btnImprimir.hidden = true;
            mensagem.textContent =
                "Não foi possível gerar o relatório. Verifique a API.";
        }
    });

    // Ao trocar o tipo, esconde o relatório anterior.
    tipo.addEventListener("change", () => {
        area.hidden = true;
        btnImprimir.hidden = true;
        mensagem.textContent = "";
    });

    btnImprimir.addEventListener("click", () => window.print());
});