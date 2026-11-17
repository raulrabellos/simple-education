// 404.html: página não encontrada para quem está logado (dentro do layout).
import { paginaPrivada } from '../layout.js';
import { mostrarNaoEncontrado } from '../nao-encontrado.js';

paginaPrivada((conteudo) => {
  mostrarNaoEncontrado(conteudo);
});
