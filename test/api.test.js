'use strict';
/* Testes de ponta a ponta da API: sobem o servidor com um banco temporário e usam fetch de verdade. */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PORT = 3900 + Math.floor(Math.random() * 90);
const BASE = `http://localhost:${PORT}`;
let proc, dir, saida = '';

class Sessao {
  constructor() { this.cookie = ''; }
  async req(method, url, body, extra) {
    const headers = Object.assign({ 'X-ER': '1' }, extra && extra.headers);
    if (this.cookie) headers.Cookie = this.cookie;
    let corpo;
    if (extra && extra.raw !== undefined) corpo = extra.raw;
    else if (body !== undefined) { headers['Content-Type'] = 'application/json'; corpo = JSON.stringify(body); }
    const r = await fetch(BASE + url, { method, headers, body: corpo });
    const sc = r.headers.get('set-cookie');
    if (sc) this.cookie = sc.split(';')[0].startsWith('er_sid=;') || /Max-Age=0/.test(sc) ? '' : sc.split(';')[0];
    return r;
  }
  async json(method, url, body, extra) { const r = await this.req(method, url, body, extra); let j = {}; try { j = await r.json(); } catch (e) { /* sem corpo */ } return { status: r.status, j }; }
}

before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'er-test-'));
  proc = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], { env: Object.assign({}, process.env, { PORT, ER_DATA: dir }), stdio: ['ignore', 'pipe', 'inherit'] });
  proc.stdout.on('data', d => { saida += d; });
  for (let i = 0; i < 50; i++) { try { await fetch(BASE + '/api/eu'); return; } catch (e) { await new Promise(r => setTimeout(r, 100)); } }
  throw new Error('servidor não subiu');
});
after(() => { proc.kill(); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* windows pode segurar o arquivo */ } });

const autor = new Sessao(), leitor = new Sessao(), estranho = new Sessao();
let produto, pedido, fid;
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

test('páginas e proteção de arquivos estáticos', async () => {
  for (const p of ['/', '/index.html', '/catalogo.html', '/produto.html', '/checkout.html', '/obrigado.html', '/biblioteca.html', '/entrar.html', '/painel.html', '/novo-produto.html', '/conta.html', '/js/data.js', '/css/style.css', '/js/vendor/qrcode.js']) {
    assert.equal((await fetch(BASE + p)).status, 200, p);
  }
  for (const p of ['/server.js', '/package.json', '/data/db.json', '/js/../server.js', '/js/%2e%2e/server.js', '/.claude/skills/x', '/test/api.test.js']) {
    assert.equal((await fetch(BASE + p)).status, 404, p);
  }
});

test('POST sem cabeçalho X-ER é recusado (CSRF)', async () => {
  const r = await fetch(BASE + '/api/entrar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(r.status, 403);
});

test('cadastro valida campos e impede e-mail duplicado', async () => {
  assert.equal((await autor.json('POST', '/api/cadastro', { nome: 'A', email: 'x@y.com', senha: '12345678' })).status, 400);
  assert.equal((await autor.json('POST', '/api/cadastro', { nome: 'Ana Autora', email: 'semarroba', senha: '12345678' })).status, 400);
  assert.equal((await autor.json('POST', '/api/cadastro', { nome: 'Ana Autora', email: 'ana@teste.com', senha: 'curta' })).status, 400);
  const ok = await autor.json('POST', '/api/cadastro', { nome: 'Ana Autora', email: 'ana@teste.com', senha: 'senha-segura-1' });
  assert.equal(ok.status, 200); assert.equal(ok.j.usuario.email, 'ana@teste.com'); assert.ok(!('hash' in ok.j.usuario));
  assert.equal((await new Sessao().json('POST', '/api/cadastro', { nome: 'Outra', email: 'ANA@teste.com', senha: 'senha-segura-1' })).status, 409);
  assert.equal((await autor.json('GET', '/api/eu')).j.usuario.nome, 'Ana Autora');
});

test('login, logout e senha errada', async () => {
  const s = new Sessao();
  assert.equal((await s.json('POST', '/api/entrar', { email: 'ana@teste.com', senha: 'errada-errada' })).status, 401);
  assert.equal((await s.json('POST', '/api/entrar', { email: 'ana@teste.com', senha: 'senha-segura-1' })).status, 200);
  assert.ok((await s.json('GET', '/api/eu')).j.usuario);
  await s.json('POST', '/api/sair');
  assert.equal((await s.json('GET', '/api/eu')).j.usuario, null);
});

test('chave Pix é validada por tipo', async () => {
  const base = { nome: 'Ana Autora', bio: 'Escrevo.', cidade: 'Recife' };
  assert.equal((await autor.json('PUT', '/api/eu', { ...base, pixTipo: 'cpf', pixChave: '111.111.111-11' })).status, 400);
  assert.equal((await autor.json('PUT', '/api/eu', { ...base, pixTipo: 'cpf', pixChave: '123.456.789-00' })).status, 400);
  assert.equal((await autor.json('PUT', '/api/eu', { ...base, pixTipo: 'email', pixChave: 'sem-arroba' })).status, 400);
  assert.equal((await autor.json('PUT', '/api/eu', { ...base, pixTipo: 'celular', pixChave: '123' })).status, 400);
  const ok = await autor.json('PUT', '/api/eu', { ...base, pixTipo: 'cpf', pixChave: '529.982.247-25' });
  assert.equal(ok.status, 200); assert.equal(ok.j.usuario.pixChave, '52998224725'); assert.equal(ok.j.usuario.temPix, true);
});

test('publicar sem Pix cadastrado é recusado', async () => {
  const s = new Sessao();
  await s.json('POST', '/api/cadastro', { nome: 'Sem Pix', email: 'sempix@teste.com', senha: 'senha-segura-1' });
  const up = await s.json('POST', '/api/arquivos?nome=a.pdf', undefined, { raw: PDF, headers: { 'Content-Type': 'application/pdf' } });
  assert.equal(up.status, 200);
  const r = await s.json('POST', '/api/produtos', corpoProduto([up.j.arquivo.fid]));
  assert.equal(r.status, 409); assert.match(r.j.erro, /Pix/);
});

function corpoProduto(arquivos, extra) {
  return Object.assign({ titulo: 'Guia de Feira', sub: 'Vinte refeições', cat: 'culinaria', tipo: 'Guia ou apostila', desc: 'Um guia completo para quem compra na feira.\nSegundo parágrafo.', preco: 24.9, garantia: 7, capa: { motif: 'prato', bg: '#14344B', fg: '#FAF5EC', ac: '#D98A4E' }, arquivos, amostra: 'Trecho de teste.', sumario: 'Intro\nCapítulo 1' }, extra);
}

test('upload valida formato, exige login e guarda o conteúdo', async () => {
  assert.equal((await new Sessao().json('POST', '/api/arquivos?nome=a.pdf', undefined, { raw: PDF })).status, 401);
  assert.equal((await autor.json('POST', '/api/arquivos?nome=virus.exe', undefined, { raw: PDF })).status, 400);
  assert.equal((await autor.json('POST', '/api/arquivos?nome=vazio.pdf', undefined, { raw: Buffer.alloc(0) })).status, 400);
  const up = await autor.json('POST', '/api/arquivos?nome=' + encodeURIComponent('Guia de Feira.pdf'), undefined, { raw: PDF, headers: { 'Content-Type': 'application/pdf' } });
  assert.equal(up.status, 200); assert.equal(up.j.arquivo.ext, 'pdf'); fid = up.j.arquivo.fid;
});

test('validação do produto', async () => {
  const ruins = [{ titulo: 'ab' }, { cat: 'inexistente' }, { tipo: 'X' }, { desc: 'curta' }, { preco: 4 }, { preco: 'abc' }, { preco: 5000 }, { capa: { motif: 'nada', bg: '#000000', fg: '#ffffff', ac: '#123456' } }, { capa: { motif: 'sol', bg: 'red', fg: '#ffffff', ac: '#123456' } }, { arquivos: [] }, { arquivos: ['naoexiste'] }];
  for (const r of ruins) assert.equal((await autor.json('POST', '/api/produtos', corpoProduto([fid], r))).status, 400, JSON.stringify(r));
});

test('publicar produto e aparecer no catálogo público', async () => {
  const r = await autor.json('POST', '/api/produtos', corpoProduto([fid]));
  assert.equal(r.status, 200); produto = r.j.produto;
  assert.equal(produto.preco, 24.9); assert.equal(produto.status, 'publicado');
  const lista = await new Sessao().json('GET', '/api/produtos');
  assert.equal(lista.j.produtos.length, 1);
  const det = await new Sessao().json('GET', '/api/produtos/' + produto.id);
  assert.equal(det.j.produto.titulo, 'Guia de Feira'); assert.deepEqual(det.j.produto.sumario, ['Intro', 'Capítulo 1']);
  assert.ok(!JSON.stringify(det.j).includes(fid), 'o id do arquivo não pode vazar na página pública');
});

test('arquivo já ligado a um produto não serve a outro produto', async () => {
  const r = await autor.json('POST', '/api/produtos', corpoProduto([fid], { titulo: 'Outro Guia' }));
  assert.equal(r.status, 400);
});

test('arquivo só baixa com acesso: anônimo, estranho e comprador sem pagamento são barrados', async () => {
  assert.equal((await new Sessao().req('GET', '/api/arquivos/' + fid)).status, 401);
  await estranho.json('POST', '/api/cadastro', { nome: 'Pessoa Estranha', email: 'estranho@teste.com', senha: 'senha-segura-1' });
  assert.equal((await estranho.req('GET', '/api/arquivos/' + fid)).status, 403);
  const dono = await autor.req('GET', '/api/arquivos/' + fid);
  assert.equal(dono.status, 200); assert.equal(Buffer.from(await dono.arrayBuffer()).toString(), PDF.toString());
});

test('fluxo de compra: pedido, Pix válido, aviso, confirmação do autor e liberação', async () => {
  await leitor.json('POST', '/api/cadastro', { nome: 'Lia Leitora', email: 'lia@teste.com', senha: 'senha-segura-1' });
  assert.equal((await new Sessao().json('POST', '/api/pedidos', { pid: produto.id })).status, 401);
  assert.equal((await autor.json('POST', '/api/pedidos', { pid: produto.id })).status, 409, 'autor não compra o próprio produto');
  const c = await leitor.json('POST', '/api/pedidos', { pid: produto.id });
  assert.equal(c.status, 200); pedido = c.j.pedido;
  assert.equal(pedido.status, 'aguardando'); assert.equal(pedido.valor, 24.9); assert.match(pedido.id, /^EL-\d{6}$/);
  assert.equal(pedido.arquivos, undefined);

  // BR Code: formato EMV, valor, chave e CRC corretos
  const pix = pedido.pix;
  assert.ok(pix.startsWith('000201010212'));
  assert.ok(pix.includes('br.gov.bcb.pix0111' + '52998224725'));
  assert.ok(pix.includes('540524.90'));
  assert.ok(pix.includes('5802BR'));
  const { crc16 } = require('../server.js');
  assert.equal(pix.slice(-4), crc16(pix.slice(0, -4)));
  assert.equal(crc16('123456789'), '29B1', 'CRC16/CCITT-FALSE');

  // mesmo pedido em aberto é reaproveitado
  assert.equal((await leitor.json('POST', '/api/pedidos', { pid: produto.id })).j.pedido.id, pedido.id);

  // sem pagamento confirmado, sem arquivo
  assert.equal((await leitor.req('GET', '/api/arquivos/' + fid)).status, 403);
  // leitor não pode confirmar o próprio pagamento
  assert.equal((await leitor.json('POST', `/api/pedidos/${pedido.id}/confirmar`)).status, 404);
  assert.equal((await estranho.json('POST', `/api/pedidos/${pedido.id}/confirmar`)).status, 404);
  assert.equal((await estranho.json('GET', `/api/pedidos/${pedido.id}`)).status, 404);

  assert.equal((await leitor.json('POST', `/api/pedidos/${pedido.id}/avisar`)).j.pedido.avisoPago, true);
  const v = await autor.json('GET', '/api/vendedor');
  assert.equal(v.j.pedidos[0].comprador, 'Lia Leitora'); assert.equal(v.j.pedidos[0].avisoPago, true);

  const conf = await autor.json('POST', `/api/pedidos/${pedido.id}/confirmar`);
  assert.equal(conf.j.pedido.status, 'pago');
  assert.equal((await autor.json('POST', `/api/pedidos/${pedido.id}/confirmar`)).status, 409);

  const dl = await leitor.req('GET', '/api/arquivos/' + fid + '?baixar=1');
  assert.equal(dl.status, 200); assert.match(dl.headers.get('content-disposition'), /attachment/);
  assert.equal(Buffer.from(await dl.arrayBuffer()).toString(), PDF.toString());
  const inline = await leitor.req('GET', '/api/arquivos/' + fid);
  assert.match(inline.headers.get('content-disposition'), /inline/);
  const rng = await leitor.req('GET', '/api/arquivos/' + fid, undefined, { headers: { Range: 'bytes=0-3' } });
  assert.equal(rng.status, 206); assert.equal(Buffer.from(await rng.arrayBuffer()).toString(), '%PDF');
  assert.equal((await estranho.req('GET', '/api/arquivos/' + fid)).status, 403);

  const est = await leitor.json('GET', '/api/estante');
  assert.equal(est.j.pedidos[0].arquivos[0].fid, fid);
  assert.equal((await leitor.json('POST', '/api/pedidos', { pid: produto.id })).status, 409, 'não compra duas vezes');
  assert.equal((await new Sessao().json('GET', '/api/produtos')).j.produtos[0].vendas, 1);
});

test('avaliações: só quem comprou, uma por pessoa, com média e distribuição', async () => {
  const r = { nota: 5, texto: 'Excelente guia, útil de verdade.' };
  assert.equal((await estranho.json('POST', `/api/produtos/${produto.id}/avaliacao`, r)).status, 403);
  assert.equal((await leitor.json('POST', `/api/produtos/${produto.id}/avaliacao`, { nota: 9, texto: 'abc' })).status, 400);
  assert.equal((await leitor.json('POST', `/api/produtos/${produto.id}/avaliacao`, { nota: 4, texto: '' })).status, 400);
  assert.equal((await leitor.json('POST', `/api/produtos/${produto.id}/avaliacao`, r)).status, 200);
  assert.equal((await leitor.json('POST', `/api/produtos/${produto.id}/avaliacao`, { nota: 4, texto: 'Mudei de ideia: bom.' })).status, 200);
  const d = (await new Sessao().json('GET', '/api/produtos/' + produto.id)).j.produto;
  assert.equal(d.aval, 1); assert.equal(d.nota, 4); assert.equal(d.avaliacoes[0].nome, 'Lia L.'); assert.deepEqual(d.dist, [0, 1, 0, 0, 0]);
});

test('reembolso: pedido do comprador, decisão do autor, acesso revogado', async () => {
  assert.equal((await estranho.json('POST', `/api/pedidos/${pedido.id}/reembolso`, {})).status, 404);
  assert.equal((await leitor.json('POST', `/api/pedidos/${pedido.id}/reembolso`, { motivo: 'Não era o que eu esperava' })).j.pedido.status, 'reembolso_pedido');
  assert.equal((await leitor.req('GET', '/api/arquivos/' + fid)).status, 200, 'enquanto pendente mantém acesso');
  assert.equal((await leitor.json('POST', `/api/pedidos/${pedido.id}/reembolso/decidir`, { aprovar: true })).status, 404);
  assert.equal((await autor.json('POST', `/api/pedidos/${pedido.id}/reembolso/decidir`, { aprovar: false })).j.pedido.status, 'pago');
  await leitor.json('POST', `/api/pedidos/${pedido.id}/reembolso`, {});
  assert.equal((await autor.json('POST', `/api/pedidos/${pedido.id}/reembolso/decidir`, { aprovar: true })).j.pedido.status, 'reembolsado');
  assert.equal((await leitor.req('GET', '/api/arquivos/' + fid)).status, 403);
  assert.equal((await new Sessao().json('GET', '/api/produtos')).j.produtos[0].vendas, 0);
  const recompra = await leitor.json('POST', '/api/pedidos', { pid: produto.id });
  assert.equal(recompra.status, 200); assert.notEqual(recompra.j.pedido.id, pedido.id);
  assert.equal((await leitor.json('POST', `/api/pedidos/${recompra.j.pedido.id}/cancelar`)).j.pedido.status, 'cancelado');
});

test('despublicar esconde do catálogo; editar troca dados; apagar com pedidos é recusado', async () => {
  assert.equal((await estranho.json('POST', `/api/produtos/${produto.id}/status`, { status: 'rascunho' })).status, 404);
  await autor.json('POST', `/api/produtos/${produto.id}/status`, { status: 'rascunho' });
  assert.equal((await new Sessao().json('GET', '/api/produtos')).j.produtos.length, 0);
  assert.equal((await new Sessao().json('GET', '/api/produtos/' + produto.id)).status, 404);
  assert.equal((await leitor.json('POST', '/api/pedidos', { pid: produto.id })).status, 404);
  const ed = await autor.json('PUT', '/api/produtos/' + produto.id, corpoProduto([fid], { titulo: 'Guia de Feira 2', preco: 30 }));
  assert.equal(ed.status, 200); assert.equal(ed.j.produto.preco, 30);
  assert.equal((await estranho.json('PUT', '/api/produtos/' + produto.id, corpoProduto([fid]))).status, 404);
  assert.equal((await autor.json('DELETE', '/api/produtos/' + produto.id)).status, 409);
  await autor.json('POST', `/api/produtos/${produto.id}/status`, { status: 'publicado' });
});

test('apagar produto sem pedidos remove também os arquivos', async () => {
  const up = (await autor.json('POST', '/api/arquivos?nome=outro.epub', undefined, { raw: Buffer.from('epub') })).j.arquivo;
  const p = (await autor.json('POST', '/api/produtos', corpoProduto([up.fid], { titulo: 'Para Apagar' }))).j.produto;
  assert.equal((await autor.json('DELETE', '/api/produtos/' + p.id)).status, 200);
  assert.equal((await autor.req('GET', '/api/arquivos/' + up.fid)).status, 403);
  assert.equal(fs.existsSync(path.join(dir, 'arquivos', up.fid)), false);
});

test('senha: trocar exige a atual e a nova vale no próximo login', async () => {
  assert.equal((await autor.json('PUT', '/api/eu/senha', { atual: 'errada', nova: 'nova-senha-123' })).status, 403);
  assert.equal((await autor.json('PUT', '/api/eu/senha', { atual: 'senha-segura-1', nova: 'curta' })).status, 400);
  assert.equal((await autor.json('PUT', '/api/eu/senha', { atual: 'senha-segura-1', nova: 'nova-senha-123' })).status, 200);
  const s = new Sessao();
  assert.equal((await s.json('POST', '/api/entrar', { email: 'ana@teste.com', senha: 'senha-segura-1' })).status, 401);
  assert.equal((await s.json('POST', '/api/entrar', { email: 'ana@teste.com', senha: 'nova-senha-123' })).status, 200);
});

test('dados persistem em disco entre reinícios', async () => {
  const db = JSON.parse(fs.readFileSync(path.join(dir, 'db.json'), 'utf8'));
  assert.ok(db.users.length >= 4); assert.ok(db.orders.length >= 2);
  assert.ok(!db.users.some(u => JSON.stringify(u).includes('senha-segura')), 'senha nunca em texto puro');
});

test('recuperação de senha: link de uso único, troca a senha e derruba sessões antigas', async () => {
  const s = new Sessao();
  assert.equal((await s.json('POST', '/api/esqueci', { email: 'invalido' })).status, 400);
  assert.equal((await s.json('POST', '/api/esqueci', { email: 'naoexiste@teste.com' })).status, 200, 'não revela se a conta existe');
  assert.ok(!/naoexiste@teste.com/.test(saida));
  assert.equal((await s.json('POST', '/api/redefinir', { token: 'falso', senha: 'outra-senha-123' })).status, 410);
  assert.equal((await s.json('POST', '/api/esqueci', { email: 'lia@teste.com' })).status, 200);
  await new Promise(r => setTimeout(r, 200));
  const token = /redefinir\.html\?token=([\w-]+)/.exec(saida)[1];
  const db = JSON.parse(fs.readFileSync(path.join(dir, 'db.json'), 'utf8'));
  assert.ok(!JSON.stringify(db.resets).includes(token), 'token guardado só como hash');
  assert.equal((await s.json('POST', '/api/redefinir', { token, senha: 'curta' })).status, 400);
  assert.ok((await leitor.json('GET', '/api/eu')).j.usuario, 'sessão antiga ainda vale antes');
  const ok = await s.json('POST', '/api/redefinir', { token, senha: 'senha-nova-456' });
  assert.equal(ok.status, 200); assert.equal(ok.j.usuario.email, 'lia@teste.com');
  assert.equal((await s.json('GET', '/api/eu')).j.usuario.email, 'lia@teste.com', 'já entra logado');
  assert.equal((await leitor.json('GET', '/api/eu')).j.usuario, null, 'sessões antigas caem');
  assert.equal((await s.json('POST', '/api/redefinir', { token, senha: 'senha-nova-456' })).status, 410, 'uso único');
  const l = new Sessao();
  assert.equal((await l.json('POST', '/api/entrar', { email: 'lia@teste.com', senha: 'senha-segura-1' })).status, 401);
  assert.equal((await l.json('POST', '/api/entrar', { email: 'lia@teste.com', senha: 'senha-nova-456' })).status, 200);
});
