/*
 * Aviso para quem abriu a página com dois cliques no arquivo (endereço começando com file://).
 * Assim o navegador não roda o sistema: é preciso abrir pelo Apache do XAMPP.
 * Este arquivo é um script comum (não módulo) para funcionar mesmo nesse caso.
 */
(function () {
  if (window.location.protocol !== 'file:') return;
  var root = document.getElementById('root');
  if (!root) return;

  function paragrafo(texto, forte) {
    var p = document.createElement('p');
    if (forte) {
      var s = document.createElement('strong');
      s.textContent = texto;
      p.appendChild(s);
    } else {
      p.textContent = texto;
    }
    return p;
  }

  var main = document.createElement('main');
  main.className = 'center-screen';
  var aviso = document.createElement('div');
  aviso.className = 'alert alert--error aviso-arquivo';
  aviso.setAttribute('role', 'alert');
  aviso.appendChild(paragrafo('Esta página foi aberta direto do arquivo e por isso não funciona.', true));
  aviso.appendChild(paragrafo('1. Abra o XAMPP Control Panel e clique em Start no Apache e no MySQL.'));
  aviso.appendChild(paragrafo('2. No navegador, acesse http://localhost/simple-education/ (troque "simple-education" pelo nome da pasta dentro de htdocs, se for outro).'));
  main.appendChild(aviso);
  root.replaceChildren(main);
})();
