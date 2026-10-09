const API_URL = 'http://127.0.0.1:5000';
const form = document.querySelector('.formulario');
const mensagem = document.getElementById('mensagem');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const tipo = select.value; // "funcionario" ou "aluno"

  // FormData ignora inputs desabilitados, então só vão os campos do bloco visível
  const dados = Object.fromEntries(new FormData(form));
  delete dados.usuario; // o select não é coluna do banco

  if (tipo === 'aluno') {
    dados.MatriculaAluno = Number(dados.MatriculaAluno); // coluna int
  }

  mensagem.textContent = 'Enviando...';

  try {
    const resposta = await fetch(`${API_URL}/${tipo}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    const corpo = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      mensagem.textContent = corpo.erro || `Erro ${resposta.status} ao cadastrar.`;
      return;
    }


mensagem.textContent = '';

alert('Cadastro realizado com sucesso!');

window.location.href = 'cadastros.html'; // volta ao estado inicial (blocos escondidos)
  } catch (erro) {
    mensagem.textContent = 'Não foi possível conectar à API. Ela está rodando?';
    console.error(erro);
  }
});