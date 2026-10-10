
const API_URL = "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", () => {
    const tipoUsuario = document.getElementById("tipoUsuario");
    const pesquisaUsuario = document.getElementById("pesquisaUsuario");
    const usuarioSelecionado = document.getElementById("usuarioSelecionado");

    const pesquisaLivro = document.getElementById("pesquisaLivro");
    const livroSelecionado = document.getElementById("livroSelecionado");

    const dataEmprestimo = document.getElementById("dataEmprestimo");
    const previsaoDevolucao = document.getElementById("previsaoDevolucao");

    const form = document.getElementById("formEmprestimo");
    const mensagem = document.getElementById("mensagemEmprestimo");

    let funcionarios = [];
    let alunos = [];
    let livros = [];

    function preencherSelect(select, itens, textoInicial, obterValor, obterTexto) {
        select.replaceChildren();

        const inicial = document.createElement("option");
        inicial.value = "";
        inicial.textContent = textoInicial;
        select.appendChild(inicial);

        itens.forEach(item => {
            const opcao = document.createElement("option");
            opcao.value = obterValor(item);
            opcao.textContent = obterTexto(item);
            select.appendChild(opcao);
        });
    }

    
async function carregarDados() {
    mensagem.textContent = "Carregando dados...";

    async function buscarLista(url, descricao) {
        const resposta = await fetch(`${API_URL}${url}`);

        if (!resposta.ok) {
            throw new Error(
                `${descricao}: erro HTTP ${resposta.status}`
            );
        }

        const dados = await resposta.json();

        if (!Array.isArray(dados)) {
            throw new Error(`${descricao}: a resposta não é uma lista.`);
        }

        return dados;
    }

    const resultados = await Promise.allSettled([
        buscarLista("/funcionarios/selecionar", "Funcionários"),
        buscarLista("/alunos/selecionar", "Alunos"),
        buscarLista("/livros", "Livros")
    ]);

    // Cada lista é carregada independentemente.
    if (resultados[0].status === "fulfilled") {
        funcionarios = resultados[0].value;
    } else {
        funcionarios = [];
        console.error(resultados[0].reason);
    }

    if (resultados[1].status === "fulfilled") {
        alunos = resultados[1].value;
    } else {
        alunos = [];
        console.error(resultados[1].reason);
    }

    if (resultados[2].status === "fulfilled") {
        livros = resultados[2].value;
    } else {
        livros = [];
        console.error(resultados[2].reason);
    }

    atualizarUsuarios();
    atualizarLivros();

    const erros = resultados
        .map((resultado, indice) => {
            if (resultado.status === "rejected") {
                return ["Funcionários", "Alunos", "Livros"][indice];
            }
            return null;
        })
        .filter(Boolean);

    if (erros.length > 0) {
        mensagem.textContent =
            "Falha ao carregar: " + erros.join(", ") +
            ". Consulte o Console do navegador.";
    } else {
        mensagem.textContent =
            "Dados carregados com sucesso.";
    }
}


    
function atualizarUsuarios() {
    const tipo = tipoUsuario.value;
    const termo = pesquisaUsuario.value.trim().toLowerCase();

    if (!tipo) {
        preencherSelect(
            usuarioSelecionado,
            [],
            "Selecione primeiro o tipo de usuário",
            usuario => "",
            usuario => ""
        );

        usuarioSelecionado.disabled = true;
        pesquisaUsuario.disabled = true;
        return;
    }

    usuarioSelecionado.disabled = false;
    pesquisaUsuario.disabled = false;

    const lista = tipo === "funcionario"
        ? funcionarios
        : alunos;

    const filtrados = lista.filter(usuario => {
        const nome = tipo === "funcionario"
            ? usuario.NomeFuncionario
            : usuario.NomeAluno;

        const identificacao = tipo === "funcionario"
            ? usuario.RegistroFuncionario
            : usuario.MatriculaAluno;

        return String(nome ?? "").toLowerCase().includes(termo) ||
               String(identificacao ?? "").toLowerCase().includes(termo);
    });

    preencherSelect(
        usuarioSelecionado,
        filtrados,
        filtrados.length
            ? "Selecione o usuário"
            : "Nenhum usuário encontrado",
        usuario => tipo === "funcionario"
            ? usuario.idfuncionario
            : usuario.idAluno,
        usuario => {
            const nome = tipo === "funcionario"
                ? usuario.NomeFuncionario
                : usuario.NomeAluno;

            const identificacao = tipo === "funcionario"
                ? usuario.RegistroFuncionario
                : usuario.MatriculaAluno;

            return `${nome} — ${identificacao}`;
        }
    );
}


    function atualizarLivros() {
        const termo = pesquisaLivro.value.trim().toLowerCase();

        const filtrados = livros.filter(livro => {
            const texto = [
                livro.NomeLivro,
                livro.AutorLivro,
                livro.EditoraLivro,
                livro.ISBN_Livro,
                livro.Categoria_Livro
            ].join(" ").toLowerCase();

            return texto.includes(termo);
        });

        preencherSelect(
            livroSelecionado,
            filtrados,
            filtrados.length ? "Selecione o livro" : "Nenhum livro encontrado",
            livro => livro.idLivro,
            livro =>
                `${livro.NomeLivro} — ${livro.AutorLivro} | ISBN: ${livro.ISBN_Livro}`
        );
    }

    tipoUsuario.addEventListener("change", () => {
        const selecionado = tipoUsuario.value !== "";

        pesquisaUsuario.disabled = !selecionado;
        usuarioSelecionado.disabled = !selecionado;
        pesquisaUsuario.value = "";

        atualizarUsuarios();
    });

    pesquisaUsuario.addEventListener("input", atualizarUsuarios);
    pesquisaLivro.addEventListener("input", atualizarLivros);

    // Preenche a data do empréstimo com a data local do navegador.
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    dataEmprestimo.value = `${ano}-${mes}-${dia}`;
    dataEmprestimo.max = `${ano}-${mes}-${dia}`;
    previsaoDevolucao.min = dataEmprestimo.value;

    dataEmprestimo.addEventListener("change", () => {
        previsaoDevolucao.min = dataEmprestimo.value;

        if (
            previsaoDevolucao.value &&
            previsaoDevolucao.value < dataEmprestimo.value
        ) {
            previsaoDevolucao.value = "";
        }
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const tipo = tipoUsuario.value;
        const idUsuario = usuarioSelecionado.value;
        const idLivro = livroSelecionado.value;

        if (!tipo || !idUsuario || !idLivro) {
            mensagem.textContent =
                "Selecione o tipo de usuário, o usuário e o livro.";
            return;
        }

        if (previsaoDevolucao.value < dataEmprestimo.value) {
            mensagem.textContent =
                "A previsão de devolução não pode ser anterior ao empréstimo.";
            return;
        }

        const dados = {
            tipoUsuario: tipo,
            idUsuario: Number(idUsuario),
            idLivro: Number(idLivro),
            DataEmprestimo: dataEmprestimo.value,
            PrevisaoDevolucao: previsaoDevolucao.value
        };

        try {
            const resposta = await fetch(`${API_URL}/emprestimos/novo`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dados)
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                mensagem.textContent =
                    resultado.erro || "Não foi possível registrar o empréstimo.";
                return;
            }

            mensagem.textContent = "Empréstimo registrado com sucesso!";
            form.reset();

            dataEmprestimo.value = `${ano}-${mes}-${dia}`;
            dataEmprestimo.max = `${ano}-${mes}-${dia}`;
            previsaoDevolucao.min = dataEmprestimo.value;

            tipoUsuario.dispatchEvent(new Event("change"));
            atualizarLivros();

        } catch (erro) {
            console.error(erro);
            mensagem.textContent =
                "Falha de conexão com a API.";
        }
    });

    carregarDados();
});
