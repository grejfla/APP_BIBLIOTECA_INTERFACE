const formulario = document.getElementById("formLivro");
const mensagem = document.getElementById("mensagem");

const API_URL = "http://127.0.0.1:5000/livros";


formulario.addEventListener("submit", async function(evento) {

    evento.preventDefault();


    // =====================================================
    // PEGAR OS VALORES DO FORMULÁRIO
    // =====================================================

    const titulo = document.getElementById("titulo").value;
    const autor = document.getElementById("autor").value;
    const editora = document.getElementById("editora").value;
    const isbn = document.getElementById("isbn").value;
    const ano = document.getElementById("ano").value;
    const categoria = document.getElementById("categoria").value;
    const quantidade = document.getElementById("quantidade").value;
    const status = document.getElementById("status").value;
    const sinopse = document.getElementById("sinopse").value;


    // =====================================================
    // MONTAR OBJETO
    // =====================================================

    const livro = {

        NomeLivro: titulo,

        AutorLivro: autor,

        EditoraLivro: editora,

        AnoPublicacaoLivro: Number(ano),

        ISBN_Livro: isbn,

        Categoria_Livro: categoria,

        QuantidadeLivro: Number(quantidade),

        StatusLivros: status,

        DescricaoLivro: sinopse
    };


    console.log("Dados enviados para a API:");
    console.log(livro);


    // =====================================================
    // ENVIAR PARA A API
    // =====================================================

    try {

        const resposta = await fetch(`${API_URL}`, {

            method: "POST",

            headers: {

                "Content-Type": "application/json"
            },

            body: JSON.stringify(livro)
        });


        // =================================================
        // VERIFICAR ERRO
        // =================================================

        if (!resposta.ok) {

            const erro = await resposta.text();

            throw new Error(
                `Erro ${resposta.status}: ${erro}`
            );
        }


        // =================================================
        // RECEBER RESPOSTA DA API
        // =================================================

        const dados = await resposta.json();


        console.log("Resposta da API:");
        console.log(dados);


        // =================================================
        // MOSTRAR MENSAGEM
        // =================================================

        mensagem.innerHTML = `

            <p style="color: green;">

                Livro cadastrado com sucesso!

                ID: ${dados.idLivro}

            </p>

        `;


        // =================================================
        // LIMPAR FORMULÁRIO
        // =================================================

        formulario.reset();


    } catch (erro) {

        console.error("Erro:", erro);


        mensagem.innerHTML = `

            <p style="color: red;">

                Erro ao cadastrar o livro.

                Verifique se a API está funcionando.

            </p>

        `;
    }

});