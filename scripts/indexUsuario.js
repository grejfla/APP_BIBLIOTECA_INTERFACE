const API_URL = "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", async () => {
    // Sem login salvo, volta para a tela inicial.
    let sessao = null;
    try {
        sessao = JSON.parse(sessionStorage.getItem("usuario"));
    } catch { /* sessão inválida */ }

    if (!sessao || !sessao.id || !sessao.tipoUsuario) {
        window.location.href = "index.html";
        return;
    }

    const $ = id => document.getElementById(id);

    $("btnSair").addEventListener("click", event => {
        event.preventDefault();
        sessionStorage.removeItem("usuario");
        window.location.href = "index.html";
    });

    async function buscar(rota) {
        const resp = await fetch(`${API_URL}${rota}`);
        if (!resp.ok) throw new Error(`Erro HTTP ${resp.status} em ${rota}`);
        return resp.json();
    }

    function formatarData(valor) {
        if (!valor) return "—";
        const d = new Date(valor);
        if (isNaN(d)) return String(valor);
        return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
    }

    function iniciais(nome) {
        const p = (nome || "?").trim().split(/\s+/);
        return ((p[0]?.[0] || "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
    }

    function td(texto) {
        const el = document.createElement("td");
        el.textContent = texto ?? "—";
        return el;
    }

    function tdStatus(texto, classe) {
        const el = document.createElement("td");
        const span = document.createElement("span");
        span.className = `status ${classe}`;
        span.textContent = texto;
        el.appendChild(span);
        return el;
    }

    function linhaVazia(corpo, colunas, texto) {
        corpo.replaceChildren();
        const tr = document.createElement("tr");
        const c = td(texto);
        c.colSpan = colunas;
        tr.appendChild(c);
        corpo.appendChild(tr);
    }

    // ---------- Perfil ----------
    function desenharPerfil(p) {
        $("nomePerfil").textContent = p.nome;
        $("nomeHeader").textContent = p.nome;
        $("avatarGrande").textContent = iniciais(p.nome);
        $("avatarPequeno").textContent = iniciais(p.nome);
        $("identificacaoPerfil").textContent =
            `${p.tipo === "Aluno" ? "Matrícula" : "Registro"}: ${p.identificacao}`;

        const campos = [["Tipo de usuário", p.tipo]];
        if (p.turma) campos.push(["Turma", p.turma]);
        if (p.contato) campos.push(["Contato", p.contato]);
        if (p.endereco) campos.push(["Endereço", p.endereco]);

        const dl = $("infoPerfil");
        dl.replaceChildren();
        campos.forEach(([rotulo, valor]) => {
            const dt = document.createElement("dt");
            const dd = document.createElement("dd");
            dt.textContent = rotulo;
            dd.textContent = valor;
            dl.append(dt, dd);
        });
    }

    // ---------- Empréstimos ----------
    function desenharEmprestimos(lista) {
        const hoje = new Date().toISOString().slice(0, 10);
        const abertos = lista.filter(e => !e.DataDevolucaoReal);
        const devolvidos = lista.filter(e => e.DataDevolucaoReal);
        const atrasados = abertos.filter(e => (e.PrevisaoDevolucao || "") < hoje);

        $("resAndamento").textContent = abertos.length;
        $("resAtraso").textContent = atrasados.length;
        $("resDevolvidos").textContent = devolvidos.length;

                const corpoA = $("corpoAndamento");
        if (abertos.length === 0) {
            linhaVazia(corpoA, 6, "Nenhum empréstimo em andamento.");
        } else {
            corpoA.replaceChildren();
            abertos.forEach(e => {
                const atrasado = (e.PrevisaoDevolucao || "") < hoje;
                const noLimite = e.Renovacoes >= e.LimiteRenovacoes;
                const tr = document.createElement("tr");

                const celulaAcao = document.createElement("td");
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "acao-link";
                btn.textContent =
                    `Renovar (${e.Renovacoes}/${e.LimiteRenovacoes})`;

                if (atrasado) {
                    btn.disabled = true;
                    btn.title = "Empréstimo em atraso: procure o balcão.";
                } else if (noLimite) {
                    btn.disabled = true;
                    btn.title = "Limite de renovações atingido.";
                } else {
                    btn.addEventListener("click", () =>
                        renovar(e.idEmprestimo, btn));
                }
                celulaAcao.appendChild(btn);

                tr.append(
                    td(e.NomeLivro || "Não identificado"),
                    td(e.AutorLivro),
                    td(formatarData(e.DataEmprestimo)),
                    td(formatarData(e.PrevisaoDevolucao)),
                    tdStatus(atrasado ? "Atrasado" : "Em dia", atrasado ? "atraso" : "ok"),
                    celulaAcao
                );
                corpoA.appendChild(tr);
            });
        }

        const corpoH = $("corpoHistorico");
        if (devolvidos.length === 0) {
            linhaVazia(corpoH, 4, "Nenhum empréstimo devolvido até o momento.");
        } else {
            corpoH.replaceChildren();
            devolvidos.forEach(e => {
                const tr = document.createElement("tr");
                tr.append(
                    td(e.NomeLivro || "Não identificado"),
                    td(e.AutorLivro),
                    td(formatarData(e.DataEmprestimo)),
                    td(formatarData(e.DataDevolucaoReal))
                );
                corpoH.appendChild(tr);
            });
        }
    }

        async function recarregarEmprestimos() {
        const lista = await buscar(`/usuario/${sessao.tipoUsuario}/${sessao.id}/emprestimos`);
        desenharEmprestimos(lista);
    }

    async function renovar(idEmprestimo, botao) {
        botao.disabled = true;
        $("mensagemGeral").textContent = "Renovando...";

        try {
            const resp = await fetch(`${API_URL}/emprestimos/${idEmprestimo}/renovar`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tipoUsuario: sessao.tipoUsuario,
                    idUsuario: sessao.id
                })
            });
            const resultado = await resp.json();

            if (!resp.ok) {
                $("mensagemGeral").textContent =
                    resultado.erro || "Não foi possível renovar.";
                botao.disabled = false;
                return;
            }

            $("mensagemGeral").textContent =
                `Renovado! Nova devolução: ${formatarData(resultado.PrevisaoDevolucao)}.`;
            await recarregarEmprestimos();

        } catch (erro) {
            console.error("Erro ao renovar:", erro);
            $("mensagemGeral").textContent =
                "Falha de conexão. Verifique a API.";
            botao.disabled = false;
        }
    }

    // ---------- Busca no acervo ----------
    let acervo = [];

    function desenharBusca(termo, categoria) {
        const t = termo.trim().toLowerCase();
        const filtrados = acervo.filter(l => {
            const texto = [l.NomeLivro, l.AutorLivro, l.ISBN_Livro]
                .join(" ").toLowerCase();
            return texto.includes(t) &&
                (!categoria || l.Categoria_Livro === categoria);
        });

        const corpo = $("corpoBusca");
        corpo.replaceChildren();
        $("tabelaBusca").hidden = filtrados.length === 0;
        $("mensagemBusca").textContent =
            `Resultados encontrados: ${filtrados.length}`;

        filtrados.forEach(l => {
            const tr = document.createElement("tr");
            tr.append(
                td(l.NomeLivro), td(l.AutorLivro),
                td(l.Categoria_Livro), td(l.StatusLivros)
            );
            corpo.appendChild(tr);
        });
    }

    $("formBusca").addEventListener("submit", event => {
        event.preventDefault();
        desenharBusca($("buscaTermo").value, $("buscaCategoria").value);
    });

    // ---------- Carga inicial ----------
    const base = `/usuario/${sessao.tipoUsuario}/${sessao.id}`;

    try {
        const [perfil, emprestimos, livros] = await Promise.all([
            buscar(`${base}/perfil`),
            buscar(`${base}/emprestimos`),
            buscar("/livros")
        ]);

        desenharPerfil(perfil);
        desenharEmprestimos(emprestimos);

        acervo = livros;
        const categorias = [...new Set(
            livros.map(l => l.Categoria_Livro).filter(Boolean)
        )].sort();
        categorias.forEach(c => {
            const op = document.createElement("option");
            op.value = c;
            op.textContent = c;
            $("buscaCategoria").appendChild(op);
        });
    } catch (erro) {
        console.error("Erro ao carregar a área do usuário:", erro);
        $("mensagemGeral").textContent =
            "Não foi possível carregar seus dados. Verifique a API.";
    }
});