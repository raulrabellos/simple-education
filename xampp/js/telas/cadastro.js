// Tela de cadastro (equivalente a RegisterPage em AuthPages.jsx).
import { api } from '../api.js';
import { EMAIL_REGEX, moldura } from '../autenticacao.js';
import { SCHOOL_YEAR_OPTIONS } from '../formatacao.js';
import { paginaPublica } from '../layout.js';
import { alertaErro, botao, campoSelecao, campoTexto, definirTitulo, el } from '../ui.js';

definirTitulo('Cadastro');

paginaPublica((root) => {
  const { main, avisos, formulario } = moldura({
    titulo: 'Criar conta',
    subtitulo: 'Cadastre-se para acessar os conteúdos e acompanhar seu progresso.',
    rodape: ['Já tem conta? ', el('a', { href: 'login.html' }, 'Entrar')],
  });

  const campos = {
    name: campoTexto({ rotulo: 'Nome', autocomplete: 'name', maxlength: '80', required: true }),
    email: campoTexto({ rotulo: 'E-mail', type: 'email', autocomplete: 'email', maxlength: '120', required: true }),
    password: campoTexto({ rotulo: 'Senha', type: 'password', autocomplete: 'new-password', dica: 'Mínimo de 8 caracteres.', maxlength: '72', required: true }),
    confirm: campoTexto({ rotulo: 'Confirmar senha', type: 'password', autocomplete: 'new-password', maxlength: '72', required: true }),
    schoolYear: campoSelecao({
      rotulo: 'Ano escolar (opcional)',
      opcoes: SCHOOL_YEAR_OPTIONS,
      dica: 'A plataforma é aberta a todos. O ano só destaca os conteúdos da sua série.',
    }),
  };
  const enviar = botao({ tipo: 'submit', classe: 'btn--block', conteudo: 'Criar conta', textoCarregando: 'Criando conta...' });
  formulario.append(...Object.values(campos).map((c) => c.wrapper), enviar);

  const valor = (campo) => (campos[campo].input ?? campos[campo].select).value;

  function mostrarErros(erros) {
    for (const [nome, campo] of Object.entries(campos)) campo.definirErro(erros[nome]);
  }

  function validar() {
    const e = {};
    const name = valor('name').trim();
    if (name.length < 2 || name.length > 80) e.name = 'Informe um nome entre 2 e 80 caracteres.';
    if (!EMAIL_REGEX.test(valor('email').trim())) e.email = 'Informe um e-mail válido.';
    if (valor('password').length < 8 || valor('password').length > 72) e.password = 'A senha deve ter entre 8 e 72 caracteres.';
    if (valor('confirm') !== valor('password')) e.confirm = 'As senhas não são iguais.';
    return e;
  }

  let enviando = false;
  formulario.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (enviando) return;
    const erros = validar();
    mostrarErros(erros);
    avisos.replaceChildren();
    if (Object.keys(erros).length) return;

    enviando = true;
    enviar.definirCarregando(true);
    try {
      await api.auth.register({
        name: valor('name').trim(),
        email: valor('email').trim(),
        password: valor('password'),
        schoolYear: valor('schoolYear') ? Number(valor('schoolYear')) : null,
      });
      window.location.replace('inicio.html');
    } catch (err) {
      mostrarErros(err.details ?? {});
      avisos.replaceChildren(alertaErro(err));
      enviando = false;
      enviar.definirCarregando(false);
    }
  });

  root.appendChild(main);
});
