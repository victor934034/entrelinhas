/* Cliente da API da entre linhas e utilitários de formatação. */
(function () {
  const CATEGORIAS = [
    { id: 'ficcao', nome: 'Ficção', cor: '#14344B', altura: 230 },
    { id: 'cronicas', nome: 'Crônicas e poesia', cor: '#B5652E', altura: 196 },
    { id: 'financas', nome: 'Finanças pessoais', cor: '#3F6B4A', altura: 214 },
    { id: 'arte', nome: 'Arte e imagem', cor: '#7A2E25', altura: 240 },
    { id: 'culinaria', nome: 'Culinária', cor: '#D9A441', altura: 184, lite: true },
    { id: 'tecnologia', nome: 'Tecnologia', cor: '#0E2635', altura: 222 },
    { id: 'autores', nome: 'Para quem escreve', cor: '#5E7F94', altura: 204 },
    { id: 'modelos', nome: 'Modelos e cursos', cor: '#5B5347', altura: 236 }
  ];
  const TIPOS = ['Livro digital', 'Guia ou apostila', 'Planilha ou modelo', 'Curso em vídeo', 'Áudio'];

  async function api(method, url, body) {
    const opts = { method, headers: { 'X-ER': '1' }, credentials: 'same-origin' };
    if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    const SEM_SERVIDOR = 'O servidor da entre linhas não está respondendo. Inicie com iniciar.bat (ou node server.js) e abra http://localhost:3000.';
    let r;
    try { r = await fetch(url, opts); } catch (e) { const err = new Error(SEM_SERVIDOR); err.status = 0; throw err; }
    let j = null; try { j = await r.json(); } catch (e) { /* sem corpo JSON */ }
    if (j === null) { const err = new Error(SEM_SERVIDOR); err.status = r.status || 0; throw err; }
    if (!r.ok) { const err = new Error(j.erro || 'Algo deu errado. Tente de novo.'); err.status = r.status; throw err; }
    return j;
  }

  let euPromise = null;
  function eu(forcar) {
    if (!euPromise || forcar) euPromise = api('GET', '/api/eu').then(j => j.usuario).catch(() => null);
    return euPromise;
  }
  /* Para páginas que exigem login: devolve o usuário ou manda para a tela de entrada. */
  async function exigeLogin() {
    const u = await eu();
    if (!u) { location.replace('entrar.html?next=' + encodeURIComponent(location.pathname.replace(/^\//, '') + location.search)); return new Promise(() => {}); }
    return u;
  }
  /* Só aceita destinos internos, para o parâmetro next não virar redirecionamento aberto. */
  function destinoSeguro(next, padrao) {
    return /^[a-z0-9-]+\.html(\?[^\s]*)?$/i.test(next || '') ? next : padrao;
  }

  function upload(file, onProgresso) {
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest();
      x.open('POST', '/api/arquivos?nome=' + encodeURIComponent(file.name));
      x.setRequestHeader('X-ER', '1');
      x.upload.onprogress = e => { if (e.lengthComputable && onProgresso) onProgresso(e.loaded / e.total); };
      x.onload = () => { let j = {}; try { j = JSON.parse(x.responseText); } catch (e) { /* vazio */ } x.status === 200 ? resolve(j.arquivo) : reject(new Error(j.erro || 'Não foi possível enviar o arquivo.')); };
      x.onerror = () => reject(new Error('Sem conexão. O envio foi interrompido.'));
      x.send(file);
    });
  }

  const catNome = id => { const c = CATEGORIAS.find(c => c.id === id); return c ? c.nome : ''; };
  const brl = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const num1 = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const dataBR = t => new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, '');
  const dataHora = t => new Date(t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const urlArquivo = (fid, baixar) => '/api/arquivos/' + encodeURIComponent(fid) + (baixar ? '?baixar=1' : '');

  window.ER = { CATEGORIAS, TIPOS, api, eu, exigeLogin, destinoSeguro, upload, catNome, brl, num1, dataBR, dataHora, urlArquivo };
})();
