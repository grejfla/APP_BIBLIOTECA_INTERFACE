// Impede o navegador de recarregar a página
evento.preventDefault();

// Pega os valores dos campos
const titulo = document.getElementById("titulo").value;
const autor = document.getElementById("autor").value;
const editora = document.getElementById("editora").value;
const isbn = document.getElementById("isbn").value;
const categoria = document.getElementById("categoria").value;
const quantidade = document.getElementById("quantidade").value;
const status = document.getElementById("status").value;

// Monta o objeto exatamente com os nomes
// que a API Flask espera
const livro = {
    NomeLivro: titulo,
    AutorLivro: autor,
    EditoraLivro: editora,
    ISBN_Livro: isbn,
    Categoria_Livro: categoria,
    QuantidadeLivro: Number(quantidade),
    StatusLivros: status
};

console.log("Dados enviados para a API:");
console.log(livro);

try {

    const resposta = await fetch(`${API_URL}/livros`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(livro)

    });

    // Se a API retornar erro
    if (!resposta.ok) {

        const erro = await resposta.text();

        throw new Error(
            `Erro ${resposta.status}: ${erro}`
        );
    }

    // Pega a resposta da API
    const dados = await resposta.json();

    console.log("Resposta da API:");
    console.log(dados);

    // Mostra mensagem para o usuário
    mensagem.innerHTML = `
        <p style="color: green;">
            Livro cadastrado com sucesso!
            ID: ${dados.idLivro}
        </p>
    `;

    // Limpa o formulário
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
