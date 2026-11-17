// Conteúdo "Não encontrado" (igual a NotFoundContent da versão React).
import { definirTitulo, el, tituloPagina, trocar } from './ui.js';

export function mostrarNaoEncontrado(conteudo, mensagem = 'A página que você procura não existe ou foi movida.') {
  definirTitulo('Não encontrado');
  trocar(conteudo,
    tituloPagina(null, 'Não encontrado'),
    el('p', { class: 'page-subtitle' }, mensagem),
    el('a', { href: 'inicio.html', class: 'btn btn--primary' }, 'Voltar para o início'));
}
