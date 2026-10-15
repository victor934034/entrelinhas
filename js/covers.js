/* Capas geradas em SVG. Cada livro tem um motivo próprio; nada de imagem de banco. */
(function () {
  function hash(str) { let h = 7; for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
  function rnd(seed) { let s = seed || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const f = n => Math.round(n * 10) / 10;

  const M = {
    sol: c => {
      let s = `<circle cx="138" cy="198" r="66" fill="${c.ac}"/>`;
      for (let i = 0; i < 5; i++) s += `<rect x="60" y="${196 + i * 14}" width="160" height="${3 + i * 2.2}" fill="${c.bg}"/>`;
      s += `<rect x="24" y="286" width="60" height="2" fill="${c.fg}"/>`;
      return s;
    },
    linhas: (c, r) => {
      let s = '';
      for (let i = 0; i < 15; i++) {
        const y = 120 + i * 11.5;
        if (i === 9) { s += `<rect x="24" y="${y}" width="46" height="1.6" fill="${c.fg}"/><rect x="82" y="${y - 1}" width="70" height="3.4" fill="${c.ac}"/>`; continue; }
        s += `<rect x="24" y="${y}" width="${f(90 + r() * 86)}" height="${i % 5 === 0 ? 3 : 1.6}" fill="${c.fg}"/>`;
      }
      return s;
    },
    arco: c => {
      const fills = [c.fg, c.ac, c.fg, c.bg], op = [1, 1, .5, 1];
      return [0, 1, 2, 3].map(i => { const r = 78 - i * 18; return `<path d="M${110 - r} 300V${262 - r}a${r} ${r} 0 0 1 ${2 * r} 0V300Z" fill="${fills[i]}" opacity="${op[i]}"/>`; }).join('');
    },
    grade: (c, r) => {
      let s = '';
      for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) {
        const v = r(), px = 24 + x * 27, py = 124 + y * 27;
        if (v < .26) s += `<rect x="${px}" y="${py}" width="22" height="22" fill="${c.ac}"/>`;
        else if (v < .55) s += `<rect x="${px}" y="${py}" width="22" height="22" fill="${c.fg}" opacity=".22"/>`;
        else s += `<rect x="${px + .75}" y="${py + .75}" width="20.5" height="20.5" fill="none" stroke="${c.fg}" stroke-opacity=".55" stroke-width="1.5"/>`;
      }
      return s;
    },
    traco: c => `
      <path d="M137 157A50 50 0 1 1 88 148" fill="none" stroke="${c.fg}" stroke-width="12" stroke-linecap="round"/>
      <path d="M133 160A46 46 0 0 1 122 236" fill="none" stroke="${c.ac}" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="152" cy="246" r="4" fill="${c.ac}"/><circle cx="166" cy="232" r="2.5" fill="${c.ac}"/><circle cx="60" cy="250" r="3" fill="${c.fg}"/>
      <path d="M24 274H176" stroke="${c.fg}" stroke-width="1.6"/><path d="M24 281H92" stroke="${c.fg}" stroke-width="4" stroke-linecap="round"/>`,
    prato: c => `
      <circle cx="108" cy="208" r="66" fill="${c.fg}"/><circle cx="108" cy="208" r="55" fill="${c.bg}"/>
      <circle cx="108" cy="208" r="38" fill="${c.ac}"/><circle cx="96" cy="200" r="4" fill="${c.bg}"/><circle cx="118" cy="214" r="3" fill="${c.bg}"/><circle cx="104" cy="222" r="3.5" fill="${c.bg}"/>
      <path d="M24 150v50M30 150v50M36 150v50M30 200v80" stroke="${c.fg}" stroke-width="2.4" fill="none"/>`,
    cidade: c => {
      const hs = [92, 142, 70, 118, 100, 62], ws = [22, 28, 20, 26, 24, 20], lit = 3;
      let s = '', x = 24;
      hs.forEach((h, i) => {
        const w = ws[i]; s += `<rect x="${x}" y="${292 - h}" width="${w}" height="${h}" fill="${c.fg}"/>`;
        for (let j = 0; j < Math.floor((h - 12) / 18); j++) {
          const isLit = i === lit && j === 2;
          s += `<rect x="${x + 4}" y="${292 - h + 10 + j * 18}" width="5" height="7" fill="${isLit ? c.ac : c.bg}" opacity="${isLit ? 1 : .6}"/><rect x="${x + w - 9}" y="${292 - h + 10 + j * 18}" width="5" height="7" fill="${c.bg}" opacity=".6"/>`;
        }
        x += w + 4;
      });
      return s + `<rect x="0" y="292" width="200" height="8" fill="${c.fg}" opacity=".35"/>`;
    },
    codigo: c => {
      const rows = [[0, 84], [1, 60], [2, 96], [2, 44], [1, 70], [0, 52]];
      let s = `<circle cx="152" cy="162" r="18" fill="${c.ac}"/><circle cx="159" cy="156" r="16" fill="${c.bg}"/>`;
      rows.forEach(([ind, w], i) => { s += `<rect x="${24 + ind * 14}" y="${190 + i * 16}" width="${w}" height="6" fill="${i === 2 ? c.ac : c.fg}"/>`; });
      return s + `<rect x="${24 + 14 * 2 + 50}" y="${190 + 5 * 16 - 2}" width="7" height="12" fill="${c.ac}"/>`;
    },
    pilha: c => `
      <rect x="24" y="252" width="152" height="30" fill="${c.fg}"/><rect x="24" y="262" width="152" height="3" fill="${c.bg}" opacity=".5"/>
      <rect x="44" y="224" width="122" height="28" fill="${c.ac}"/><rect x="44" y="234" width="122" height="3" fill="${c.bg}" opacity=".5"/>
      <rect x="30" y="198" width="140" height="26" fill="${c.fg}" opacity=".7"/><rect x="30" y="206" width="140" height="3" fill="${c.bg}" opacity=".5"/>
      <path d="M128 198V158l8-6 8 6v40" fill="${c.ac}" opacity=".0"/><path d="M148 198v-46h14v46l-7-8z" fill="${c.ac}"/>`,
    casa: c => `
      <path d="M26 150H176M26 190H176M26 230H176M50 128V282M100 128V282M150 128V282" stroke="${c.fg}" stroke-opacity=".16" stroke-width="1"/>
      <path d="M62 250V194l48-40 48 40v56z" fill="none" stroke="${c.fg}" stroke-width="2.6" stroke-linejoin="miter"/>
      <rect x="98" y="214" width="24" height="36" fill="${c.ac}"/>
      <path d="M110 250C110 276 64 268 40 290" fill="none" stroke="${c.ac}" stroke-width="2.4" stroke-dasharray="3 6"/>`,
    janela: c => `
      <path d="M62 232H138L184 296H16z" fill="${c.ac}" opacity=".42"/>
      <rect x="62" y="150" width="76" height="82" fill="${c.ac}" opacity=".9"/>
      <rect x="62" y="150" width="76" height="82" fill="none" stroke="${c.fg}" stroke-width="3.5"/>
      <path d="M100 150V232M62 191H138" stroke="${c.fg}" stroke-width="3"/>`,
    checklist: (c, r) => {
      let s = '';
      for (let i = 0; i < 5; i++) {
        const y = 124 + i * 30, done = i < 3;
        s += `<rect x="24.75" y="${y + .75}" width="18.5" height="18.5" fill="${done ? c.ac : 'none'}" stroke="${done ? c.ac : c.fg}" stroke-width="1.8"/>`;
        if (done) s += `<path d="M28 ${y + 10}l4 4 8-9" fill="none" stroke="${c.bg}" stroke-width="2.4"/>`;
        s += `<rect x="54" y="${y + 6}" width="${f(60 + r() * 70)}" height="5" fill="${c.fg}" opacity="${done ? .35 : .85}"/>`;
      }
      return s;
    },
    rio: c => {
      let s = `<circle cx="152" cy="140" r="22" fill="${c.ac}"/>`;
      s += `<path d="M64 206h64l-8 16H74z" fill="${c.fg}"/><path d="M96 206v-32" stroke="${c.fg}" stroke-width="2.4"/><path d="M96 176l22 26H96z" fill="${c.ac}"/>`;
      [.28, .48, .72, 1].forEach((o, i) => { const y = 220 + i * 20; s += `<path d="M0 ${y}q25 -12 50 0t50 0t50 0t50 0V300H0z" fill="${c.fg}" opacity="${o}"/>`; });
      return s;
    },
    barras: c => {
      const hs = [38, 56, 50, 82, 104, 136];
      return hs.map((h, i) => `<rect x="${26 + i * 26}" y="${290 - h}" width="19" height="${h}" fill="${i === 5 ? c.ac : c.fg}"/>`).join('') +
        `<path d="M22 290H180" stroke="${c.fg}" stroke-width="2"/><path d="M22 150H180" stroke="${c.fg}" stroke-width="1.4" stroke-dasharray="4 5"/>`;
    },
    onda: c => [0, 1, 2, 3, 4].map(i => `<path d="M0 ${150 + i * 24}q25 -20 50 0t50 0t50 0t50 0" fill="none" stroke="${i === 2 ? c.ac : c.fg}" stroke-width="${i === 2 ? 4 : 2}"/>`).join('')
  };
  const MOTIF_LIST = ['linhas', 'arco', 'onda'];

  function cover(livro, opts) {
    const c = livro.capa || { motif: MOTIF_LIST[hash(livro.id || livro.titulo) % 3], bg: '#14344B', fg: '#FAF5EC', ac: '#D98A4E' };
    const seed = hash(livro.id || livro.titulo);
    const fn = M[c.motif] || M.linhas;
    const linhas = livro.linhas && livro.linhas.length ? livro.linhas : wrap(livro.titulo || 'Sem título');
    const maxLen = Math.max(...linhas.map(l => l.length), 6);
    const fs = Math.max(15, Math.min(28, Math.floor(150 / (maxLen * 0.53))));
    const title = linhas.map((l, i) => `<text x="24" y="${44 + fs * 0.9 + i * fs * 1.08}" font-size="${fs}" fill="${c.fg}" style="font-family:Fraunces,Georgia,serif;font-weight:600;letter-spacing:-.01em;font-variation-settings:'SOFT' 30">${esc(l)}</text>`).join('');
    const autor = esc((livro.autor || 'Autor').toUpperCase());
    const aFs = autor.length > 22 ? 7.5 : 8.5;
    const label = `Capa de ${livro.titulo || 'novo livro'}, de ${livro.autor || 'autor'}`;
    return `<svg class="cover${opts && opts.cls ? ' ' + opts.cls : ''}" viewBox="0 0 200 300" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="300" fill="${c.bg}"/>${fn(c, rnd(seed))}${title}
      <text x="24" y="20" font-size="${aFs}" fill="${c.fg}" opacity=".8" style="font-family:'IBM Plex Sans',Arial,sans-serif;font-weight:600;letter-spacing:.14em">${autor}</text>
      <rect x="0" y="0" width="7" height="300" fill="#000" opacity=".2"/><rect x="7" y="0" width="1.2" height="300" fill="#fff" opacity=".22"/>
    </svg>`;
  }
  function wrap(t) {
    const words = t.split(/\s+/), out = []; let cur = '';
    words.forEach(w => { if ((cur + ' ' + w).trim().length > 13 && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
    if (cur) out.push(cur); return out.slice(0, 4);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }

  window.coverSVG = cover;
  window.COVER_PALETTES = [
    { bg: '#14344B', fg: '#FAF5EC', ac: '#D98A4E' }, { bg: '#3F6B4A', fg: '#FAF5EC', ac: '#E8B05C' },
    { bg: '#EFE6D2', fg: '#221D17', ac: '#B5652E' }, { bg: '#7A2E25', fg: '#FAF5EC', ac: '#E8B05C' },
    { bg: '#0E2635', fg: '#EFE6D2', ac: '#E3A06B' }, { bg: '#D9A441', fg: '#221D17', ac: '#A23B2E' }
  ];
  window.COVER_MOTIFS = MOTIF_LIST;
  window.escHTML = esc;
})();
