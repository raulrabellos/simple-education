// Ícones em SVG (traço simples). São decorativos: o texto ou o aria-label do botão descreve a ação.
// Montados com createElementNS (sem HTML em texto).
const SVG_NS = 'http://www.w3.org/2000/svg';

const FORMAS = {
  inicio: [['path', { d: 'M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z' }]],
  engrenagem: [
    ['circle', { cx: '12', cy: '12', r: '3' }],
    ['path', { d: 'M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7' }],
    ['circle', { cx: '12', cy: '12', r: '6.2' }],
  ],
  sair: [
    ['path', { d: 'M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5' }],
    ['path', { d: 'M15 8l4 4-4 4M19 12H9' }],
  ],
  grafico: [['path', { d: 'M4 20h16M7 16v-5M12 16V7M17 16v-8' }]],
  usuario: [
    ['circle', { cx: '12', cy: '8.5', r: '3.5' }],
    ['path', { d: 'M5.5 19.5c.8-3.4 3.3-5 6.5-5s5.7 1.6 6.5 5' }],
  ],
  menu: [['path', { d: 'M4 7h16M4 12h16M4 17h16' }]],
  pesquisa: [['circle', { cx: '11', cy: '11', r: '6' }], ['path', { d: 'm20 20-4.2-4.2' }]],
  fechar: [['path', { d: 'M6 6l12 12M18 6 6 18' }]],
  certo: [['path', { d: 'm5 12.5 4.5 4.5L19 7.5' }]],
  voltar: [['path', { d: 'M19 12H5M11 6l-6 6 6 6' }]],
};

/** Cria o ícone pelo nome (inicio, engrenagem, sair, grafico, usuario, menu, pesquisa, fechar, certo, voltar). */
export function icone(nome, size = 24) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  const attrs = {
    width: String(size),
    height: String(size),
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.8',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
  };
  for (const [k, v] of Object.entries(attrs)) svg.setAttribute(k, v);
  for (const [tag, forma] of FORMAS[nome] ?? []) {
    const filho = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(forma)) filho.setAttribute(k, v);
    svg.appendChild(filho);
  }
  return svg;
}
