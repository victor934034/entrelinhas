/* Cabeçalho, rodapé e utilitários compartilhados por todas as telas. */
(function () {
  const BRAND_MARK = `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M2 9h28M2 23h28" stroke="#FAF5EC" stroke-width="2.2"/><path d="M12 3h8v26l-4-3.6L12 29z" fill="#D98A4E"/></svg>`;
  const brand = (href) => `<a class="brand" href="${href || 'index.html'}" aria-label="entre linhas, página inicial">${BRAND_MARK}<span>entre linhas</span></a>`;

  function header(active) {
    const a = k => (active === k ? ' aria-current="page"' : '');
    return `
    <div class="strip"><div class="wrap"><span>Você paga por Pix direto ao autor e baixa o arquivo assim que ele confirmar. Garantia de reembolso de 7 a 30 dias, conforme o produto.</span><a href="catalogo.html">Ver o catálogo</a></div></div>
    <header class="site-head"><div class="wrap">
      ${brand()}
      <form class="site-search" role="search" action="catalogo.html">${icon('search', 18)}<label class="sr-only" for="q-global">Buscar livros, guias e cursos</label><input id="q-global" name="q" type="search" placeholder="Buscar por título, autor ou assunto" autocomplete="off"></form>
      <button class="nav-toggle" aria-label="Abrir menu" aria-expanded="false" aria-controls="site-nav">${icon('menu', 22)}</button>
      <nav class="site-nav" id="site-nav" aria-label="Principal">
        <a href="catalogo.html"${a('explorar')}>Explorar</a>
        <a href="biblioteca.html"${a('biblioteca')}>Minha estante</a>
        <a href="painel.html"${a('painel')}>Vender</a>
        <span class="nav-auth" id="nav-auth"><a class="btn btn-paper" href="entrar.html">Entrar</a></span>
      </nav>
    </div></header>`;
  }

  function footer() {
    return `
    <footer class="foot">
      <div class="wrap">
        <div>${brand()}<p class="colophon">Uma livraria digital independente, para quem escreve e quem lê.</p></div>
        <div><h4>Para ler</h4><ul><li><a href="catalogo.html">Todo o catálogo</a></li><li><a href="catalogo.html?cat=ficcao">Ficção</a></li><li><a href="catalogo.html?cat=financas">Finanças pessoais</a></li><li><a href="biblioteca.html">Minha estante</a></li></ul></div>
        <div><h4>Para vender</h4><ul><li><a href="painel.html">Painel do autor</a></li><li><a href="novo-produto.html">Publicar um produto</a></li><li><a href="index.html#vender">Como vender</a></li></ul></div>
        <div><h4>Conta</h4><ul><li><a href="entrar.html">Entrar</a></li><li><a href="entrar.html#criar">Criar conta</a></li><li><a href="conta.html">Minha conta</a></li></ul></div>
      </div>
      <div class="foot-base"><div class="wrap"><span>© entre linhas</span></div></div>
    </footer>`;
  }

  function checkoutHeader() {
    return `<header class="co-head"><div class="wrap">${brand()}<span class="secure">${icon('lock', 18)} Compra protegida</span></div></header>`;
  }

  function navAuth(u) {
    const el = document.getElementById('nav-auth'); if (!el) return;
    el.innerHTML = u
      ? `<a href="conta.html" class="nav-user">${icon('user', 18)}<span>${escHTML(u.nome.split(' ')[0])}</span></a><button type="button" class="btn btn-paper" id="sair">Sair</button>`
      : '<a class="btn btn-paper" href="entrar.html">Entrar</a>';
    const b = document.getElementById('sair');
    if (b) b.onclick = async () => { try { await ER.api('POST', '/api/sair'); } catch (e) { /* segue */ } location.href = 'index.html'; };
  }

  function avisoSemServidor() {
    if (document.getElementById('aviso-servidor')) return;
    const d = document.createElement('div'); d.id = 'aviso-servidor'; d.setAttribute('role', 'alert');
    d.style.cssText = 'position:sticky;top:0;z-index:99;background:#A23B2E;color:#fff;padding:10px 16px;text-align:center;font-size:.9375rem';
    d.innerHTML = 'Você abriu o arquivo direto, sem o servidor. Login, compras e banco de dados só funcionam em <b>http://localhost:3000</b> (rode <b>iniciar.bat</b>).';
    document.body.prepend(d);
  }

  function mount(opts) {
    opts = opts || {};
    if (location.protocol === 'file:') avisoSemServidor();
    const h = document.getElementById('site-header'), f = document.getElementById('site-footer');
    if (h) h.innerHTML = opts.checkout ? checkoutHeader() : header(opts.active);
    if (f && !opts.checkout) f.innerHTML = footer();
    const t = document.querySelector('.nav-toggle');
    if (t) t.addEventListener('click', () => {
      const n = document.getElementById('site-nav'); const open = n.classList.toggle('open'); t.setAttribute('aria-expanded', open);
    });
    return ER.eu().then(u => { navAuth(u); return u; });
  }

  let toastTimer;
  function toast(msg) {
    let el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.hidden = false; el.innerHTML = icon('check', 18) + '<span>' + escHTML(msg) + '</span>';
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
  }

  function stars(nota, aval) {
    return `<span class="rating" aria-label="Nota ${ER.num1(nota)} de 5${aval ? ', ' + aval + ' avaliações' : ''}">${icon('star')}<b>${ER.num1(nota)}</b>${aval ? `<span>(${aval})</span>` : ''}</span>`;
  }

  function bookCard(l) {
    return `<a class="book-card" href="produto.html?id=${l.id}">
      <div class="shelf">${l.novo ? '<span class="corner">Novo</span>' : ''}${coverSVG(l)}</div>
      <h3>${escHTML(l.titulo)}</h3>
      <p class="by">${escHTML(l.autor)}</p>
      <div class="row"><span class="price">${ER.brl(l.preco)}</span>${l.aval ? stars(l.nota, l.aval) : '<span class="tag">Recém-publicado</span>'}</div>
    </a>`;
  }

  function trapFocus(modal, closeBtn) {
    modal.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const els = modal.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!els.length) return; const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  function openModal(back) {
    back.classList.add('open'); back._prev = document.activeElement;
    const b = back.querySelector('.modal-x'); if (b) b.focus();
  }
  function closeModal(back) { back.classList.remove('open'); if (back._prev) back._prev.focus(); }
  function bindModal(back) {
    back.addEventListener('click', e => { if (e.target === back || e.target.closest('.modal-x')) closeModal(back); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && back.classList.contains('open')) closeModal(back); });
    trapFocus(back.querySelector('.modal'));
  }

  window.L = { mount, toast, stars, bookCard, brand, openModal, closeModal, bindModal, BRAND_MARK };
})();
