// Tela de login (equivalente a LoginPage em AuthPages.jsx).
import { api } from '../api.js';
import { EMAIL_REGEX, moldura } from '../autenticacao.js';
import { acabouDeSair, destinoSeguro, paginaPublica } from '../layout.js';
import { alerta, alertaErro, botao, campoTexto, definirTitulo, el, parametro } from '../ui.js';

definirTitulo('Entrar');

paginaPublica((root) => {
  // true logo depois de clicar em "Sair" (mostra a confirmação).
  const saiu = acabouDeSair();
  // Página pedida antes do login (só páginas desta pasta); sem ela, vai para o início.
  const destino = destinoSeguro(parametro('voltar')) ?? 'inicio.html';
  let erroFormulario = null;

  const { main, avisos, formulario } = moldura({
    titulo: 'Entrar',
    subtitulo: 'Acesse sua conta para continuar estudando.',
    rodape: ['Ainda não tem conta? ', el('a', { href: 'cadastro.html' }, 'Cadastre-se')],
  });

  const email = campoTexto({ rotulo: 'E-mail', type: 'email', autocomplete: 'email', required: true });
  const senha = campoTexto({ rotulo: 'Senha', type: 'password', autocomplete: 'current-password', required: true });
  const enviar = botao({ tipo: 'submit', classe: 'btn--block', conteudo: 'Entrar', textoCarregando: 'Entrando...' });
  formulario.append(email.wrapper, senha.wrapper, enviar);

  function mostrarAvisos() {
    if (erroFormulario) avisos.replaceChildren(alertaErro(erroFormulario));
    else if (saiu) avisos.replaceChildren(alerta('success', 'Você saiu da sua conta.'));
    else avisos.replaceChildren();
  }

  let enviando = false;
  formulario.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (enviando) return;
    const erros = {};
    if (!EMAIL_REGEX.test(email.input.value.trim())) erros.email = 'Informe um e-mail válido.';
    if (!senha.input.value) erros.password = 'Informe sua senha.';
    email.definirErro(erros.email);
    senha.definirErro(erros.password);
    erroFormulario = null;
    mostrarAvisos();
    if (Object.keys(erros).length) return;

    enviando = true;
    enviar.definirCarregando(true);
    try {
      await api.auth.login(email.input.value.trim(), senha.input.value);
      window.location.replace(destino);
    } catch (err) {
      erroFormulario = err;
      mostrarAvisos();
      enviando = false;
      enviar.definirCarregando(false);
    }
  });

  mostrarAvisos();
  root.appendChild(main);
});
