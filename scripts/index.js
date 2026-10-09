
const API_URL = "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formLogin");
    const select = document.getElementById("usuario");
    const mensagem = document.getElementById("mensagem");

    const blocos = {
        funcionario: document.getElementById("campos-funcionario"),
        aluno: document.getElementById("campos-aluno")
    };

    function atualizarCampos() {
        Object.entries(blocos).forEach(([tipo, bloco]) => {
            const selecionado = select.value === tipo;

            bloco.classList.toggle("visivel", selecionado);

            bloco.querySelectorAll("input").forEach(input => {
                input.disabled = !selecionado;
                input.required = false;
            });
        });

        if (select.value === "funcionario") {
            document.getElementById("RegistroFuncionario").required = true;
            document.getElementById("SenhaFuncionario").required = true;
        }

        if (select.value === "aluno") {
            document.getElementById("MatriculaAluno").required = true;
            document.getElementById("SenhaAluno").required = true;
        }

        mensagem.textContent = "";
    }

    select.addEventListener("change", atualizarCampos);
    atualizarCampos();

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const tipo = select.value;
        let identificacao;
        let senha;

        if (tipo === "funcionario") {
            identificacao = document
                .getElementById("RegistroFuncionario")
                .value.trim();

            senha = document.getElementById("SenhaFuncionario").value;

        } else if (tipo === "aluno") {
            identificacao = document
                .getElementById("MatriculaAluno")
                .value.trim();

            senha = document.getElementById("SenhaAluno").value;

        } else {
            mensagem.textContent = "Selecione o tipo de usuário.";
            return;
        }

        if (!identificacao || !senha) {
            mensagem.textContent = "Preencha a identificação e a senha.";
            return;
        }

        mensagem.textContent = "Consultando o banco de dados...";

        try {
            const resposta = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    tipoUsuario: tipo,
                    identificacao: identificacao,
                    senha: senha
                })
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                mensagem.textContent =
                    resultado.erro || "Credenciais inválidas.";
                return;
            }

            mensagem.textContent =
                `Login realizado. Bem-vindo(a), ${resultado.nome}!`;

            // Altere se a página de destino tiver outro nome.
            window.location.href = "cadastros.html";

        } catch (erro) {
            console.error("Erro ao realizar login:", erro);
            mensagem.textContent =
                "Falha de conexão. Verifique se a API Flask está ativa.";
        }
    });
});