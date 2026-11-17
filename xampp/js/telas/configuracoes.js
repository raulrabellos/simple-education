// Configurações: nome e ano escolar (equivalente a SettingsPage.jsx).
import { api } from '../api.js';
import { SCHOOL_YEAR_OPTIONS } from '../formatacao.js';
import { paginaPrivada } from '../layout.js';
import { alerta, alertaErro, botao, campoSelecao, campoTexto, definirTitulo, el, tituloPagina } from '../ui.js';

definirTitulo('Configurações');

paginaPrivada((conteudo, contexto) => {
  const anoTexto = (u) => (u.schoolYear ? String(u.schoolYear) : '');

  const nome = campoTexto({ rotulo: 'Nome', autocomplete: 'name', maxlength: '80', required: true, value: contexto.usuario.name });
  const ano = campoSelecao({
    rotulo: 'Ano escolar',
    opcoes: SCHOOL_YEAR_OPTIONS,
    valor: anoTexto(contexto.usuario),
    dica: 'Usado para destacar os conteúdos do seu ano. Todos os conteúdos continuam disponíveis.',
  });
  const email = campoTexto({ rotulo: 'E-mail', value: contexto.usuario.email, disabled: true, dica: 'O e-mail de acesso não pode ser alterado.' });
  const salvar = botao({ tipo: 'submit', conteudo: 'Salvar alterações', textoCarregando: 'Salvando...' });
  const mensagem = el('div', { 'aria-live': 'polite' });

  /** O botão só fica ativo quando algo mudou. */
  function atualizarBotao() {
    const u = contexto.usuario;
    const unchanged = nome.input.value.trim() === u.name && (ano.select.value || null) === (anoTexto(u) || null);
    salvar.definirDesabilitado(unchanged);
  }
  nome.input.addEventListener('input', atualizarBotao);
  ano.select.addEventListener('change', atualizarBotao);

  const form = el('form', { class: 'form', novalidate: true },
    nome.wrapper, ano.wrapper, email.wrapper,
    el('div', { class: 'btn-row' }, salvar));

  let saving = false;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (saving) return;
    const name = nome.input.value.trim();
    const erros = {};
    if (name.length < 2 || name.length > 80) erros.name = 'Informe um nome entre 2 e 80 caracteres.';
    nome.definirErro(erros.name);
    ano.definirErro(undefined);
    mensagem.replaceChildren();
    if (Object.keys(erros).length) return;

    saving = true;
    salvar.definirCarregando(true);
    try {
      const data = await api.users.updateMe({ name, schoolYear: ano.select.value ? Number(ano.select.value) : null });
      const updated = data.user;
      contexto.atualizarUsuario(updated); // atualiza o "Olá, ..." do menu
      nome.input.value = updated.name;
      ano.select.value = anoTexto(updated);
      mensagem.replaceChildren(alerta('success', 'Dados atualizados com sucesso.'));
    } catch (err) {
      const details = err.details ?? {};
      nome.definirErro(details.name);
      ano.definirErro(details.schoolYear);
      mensagem.replaceChildren(alertaErro(err));
    } finally {
      saving = false;
      salvar.definirCarregando(false);
      atualizarBotao();
    }
  });

  conteudo.append(
    tituloPagina(null, 'Configurações'),
    el('p', { class: 'page-subtitle' }, 'Atualize seu nome e seu ano escolar.'),
    el('section', { class: 'card settings' }, mensagem, form));
  atualizarBotao();
});
