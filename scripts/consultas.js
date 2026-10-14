
const API_URL = "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formConsulta");
    const tipoConsulta = document.getElementById("tipoConsulta");
    const campoBusca = document.getElementById("campoBusca");
    const resultadoConsulta = document.getElementById("resultadoConsulta");
    const mensagemConsulta = document.getElementById("mensagemConsulta");

    let dadosCarregados = [];
    let tipoCarregado = "";

    // Consulta a API conforme a opção selecionada.
    async function carregarDados(tipo) {
        let rota;

        switch (tipo) {
            case "livros":
                rota = "/livros";
                break;

            case "usuarios":
                rota = "/aluno";
                break;

            case "emprestimos":
                rota = "/emprestimos";
                break;

            default:
                throw new Error("Tipo de consulta inválido.");
        }

        const resposta = await fetch(`${API_URL}${rota}`);

        if (!resposta.ok) {
            throw new Error(`Erro HTTP ${resposta.status} na rota ${rota}.`);
        }

        const dados = await resposta.json();

        if (!Array.isArray(dados)) {
            throw new Error(`A rota ${rota} não retornou uma lista.`);
        }

        // Funcionários e alunos são carregados em conjunto.
        if (tipo === "usuarios") {
            const respostaFuncionarios =
                await fetch(`${API_URL}/funcionario`);

            if (!respostaFuncionarios.ok) {
                throw new Error(
                    `Erro HTTP ${respostaFuncionarios.status} na rota /funcionario.`
                );
            }

            const funcionarios = await respostaFuncionarios.json();

            if (!Array.isArray(funcionarios)) {
                throw new Error(
                    "A rota /funcionario não retornou uma lista."
                );
            }

            return [
                ...dados.map(usuario => ({
                    ...usuario,
                    TipoUsuario: "Aluno",
                    CodigoUsuario: usuario.idAluno,
                    NomeUsuario: usuario.NomeAluno,
                    Identificacao: usuario.MatriculaAluno
                })),

                ...funcionarios.map(usuario => ({
                    ...usuario,
                    TipoUsuario: "Funcionário",
                    CodigoUsuario: usuario.idfuncionario,
                    NomeUsuario: usuario.NomeFuncionario,
                    Identificacao: usuario.RegistroFuncionario
                }))
            ];
        }

        return dados;
    }

    // Monta o texto que será apresentado na tabela.
    function obterDescricao(item, tipo) {
        if (tipo === "livros") {
            return [
                item.NomeLivro,
                `Autor: ${item.AutorLivro}`,
                `Editora: ${item.EditoraLivro}`,
                `ISBN: ${item.ISBN_Livro}`,
                `Categoria: ${item.Categoria_Livro}`
            ].join(" | ");
        }

        if (tipo === "usuarios") {
            return [
                item.NomeUsuario,
                item.TipoUsuario,
                `Identificação: ${item.Identificacao}`
            ].join(" | ");
        }

        if (tipo === "emprestimos") {
            return [
                `Livro: ${item.NomeLivro || "Não identificado"}`,
                `Usuário: ${item.NomeUsuario || "Não identificado"}`,
                `Tipo: ${item.TipoUsuario || "Não identificado"}`,
                `Empréstimo: ${item.DataEmprestimo}`,
                `Previsão de devolução: ${item.PrevisaoDevolucao}`,
                `Devolução real: ${item.DataDevolucaoReal || "Pendente"}`
            ].join(" | ");
        }

        return "";
    }

    // Define os campos usados na pesquisa.
    function obterTextoPesquisa(item, tipo) {
        if (tipo === "livros") {
            return [
                item.idLivro,
                item.NomeLivro,
                item.AutorLivro,
                item.EditoraLivro,
                item.AnoPublicacaoLivro,
                item.ISBN_Livro,
                item.Categoria_Livro,
                item.StatusLivros,
                item.DescricaoLivro
            ].join(" ");
        }

        if (tipo === "usuarios") {
            return [
                item.CodigoUsuario,
                item.NomeUsuario,
                item.TipoUsuario,
                item.Identificacao,
                item.CPF_Funcionario,
                item.EnderecoAluno,
                item.TurmaAluno,
                item.ContatoAluno
            ].join(" ");
        }

        return [
            item.idEmprestimo,
            item.idLivro,
            item.NomeLivro,
            item.idAluno,
            item.NomeAluno,
            item.idfuncionario,
            item.NomeFuncionario,
            item.NomeUsuario,
            item.TipoUsuario,
            item.DataEmprestimo,
            item.PrevisaoDevolucao,
            item.DataDevolucaoReal
        ].join(" ");
    }

    function exibirResultados(dados, tipo, termo) {
        resultadoConsulta.replaceChildren();

        const filtrados = dados.filter(item => {
            const texto = obterTextoPesquisa(item, tipo)
                .toLowerCase();

            return texto.includes(termo);
        });

        if (filtrados.length === 0) {
            const linha = document.createElement("tr");
            const celula = document.createElement("td");

            celula.colSpan = 2;
            celula.textContent = "Nenhum resultado encontrado.";

            linha.appendChild(celula);
            resultadoConsulta.appendChild(linha);
            return;
        }

        filtrados.forEach(item => {
            const linha = document.createElement("tr");
            const codigo = document.createElement("td");
            const descricao = document.createElement("td");

            if (tipo === "livros") {
                codigo.textContent = item.idLivro;
            } else if (tipo === "usuarios") {
                codigo.textContent = item.CodigoUsuario;
            } else {
                codigo.textContent = item.idEmprestimo;
            }

            descricao.textContent = obterDescricao(item, tipo);

            linha.append(codigo, descricao);
            resultadoConsulta.appendChild(linha);
        });
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const tipo = tipoConsulta.value;
        const termo = campoBusca.value.trim().toLowerCase();

        mensagemConsulta.textContent = "Consultando...";
        
        try {
            if (tipo !== tipoCarregado) {
                dadosCarregados = await carregarDados(tipo);
                tipoCarregado = tipo;
            }

            exibirResultados(dadosCarregados, tipo, termo);

            mensagemConsulta.textContent =
                "Consulta concluída. Resultados encontrados: " +
                resultadoConsulta.querySelectorAll("tr").length;
            
            // Se a tabela apresentar a mensagem de nenhum resultado,
            // o contador deve indicar zero.
            if (
                resultadoConsulta.textContent.includes(
                    "Nenhum resultado encontrado."
                )
            ) {
                mensagemConsulta.textContent =
                    "Consulta concluída. Resultados encontrados: 0";
            }

        } catch (erro) {
            console.error("Erro na consulta:", erro);

            mensagemConsulta.textContent =
                "Não foi possível consultar os dados. Verifique a API.";

            resultadoConsulta.replaceChildren();

            const linha = document.createElement("tr");
            const celula = document.createElement("td");

            celula.colSpan = 2;
            celula.textContent = "Erro ao carregar os resultados.";

            linha.appendChild(celula);
            resultadoConsulta.appendChild(linha);

            // Permite tentar carregar novamente na próxima busca.
            tipoCarregado = "";
        }
    });

    // Ao mudar a categoria, limpa os resultados anteriores.
    tipoConsulta.addEventListener("change", () => {
        campoBusca.value = "";
        tipoCarregado = "";
        dadosCarregados = [];

        resultadoConsulta.innerHTML =
            '<tr><td colspan="2">Digite sua busca ou clique em Buscar.</td></tr>';

        mensagemConsulta.textContent = "";
    });
});