/* Servidor da entre linhas: API + arquivos estáticos, sem dependências externas. */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const DATA_DIR = process.env.ER_DATA ? path.resolve(process.env.ER_DATA) : path.join(ROOT, 'data');
const FILES_DIR = path.join(DATA_DIR, 'arquivos');
const DB_FILE = path.join(DATA_DIR, 'db.json');
fs.mkdirSync(FILES_DIR, { recursive: true });

const CATEGORIAS = ['ficcao', 'cronicas', 'financas', 'arte', 'culinaria', 'tecnologia', 'autores', 'modelos'];
const TIPOS = ['Livro digital', 'Guia ou apostila', 'Planilha ou modelo', 'Curso em vídeo', 'Áudio'];
const MOTIVOS = ['sol', 'linhas', 'arco', 'grade', 'traco', 'prato', 'cidade', 'codigo', 'pilha', 'casa', 'janela', 'checklist', 'rio', 'barras', 'onda'];
const EXT_OK = { pdf: 'application/pdf', epub: 'application/epub+zip', mp4: 'video/mp4', zip: 'application/zip', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', mp3: 'audio/mpeg' };
const INLINE_OK = new Set(['pdf', 'mp4', 'mp3']);
const MAX_UPLOAD = 500 * 1024 * 1024;
const SESSAO_MS = 30 * 24 * 3600 * 1000;
const PRECO_MIN = 500, PRECO_MAX = 100000;

/* ---------- banco (JSON em disco, escrita atômica) ---------- */
let db = { seq: 0, users: [], products: [], orders: [], reviews: [], files: {}, sessions: {}, resets: {} };
try { db = Object.assign(db, JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))); } catch (e) { /* primeiro uso */ }
function save() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DB_FILE);
}
/* config.json (opcional): { "baseUrl": "http://localhost:3000", "smtp": { "host", "port", "secure", "user", "pass", "from" } } */
let config = {};
try { config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8')); } catch (e) { /* sem config */ }
const SMTP = process.env.SMTP_HOST ? { host: process.env.SMTP_HOST, port: +process.env.SMTP_PORT || 587, secure: process.env.SMTP_SECURE === '1', user: process.env.SMTP_USER, pass: process.env.SMTP_PASS, from: process.env.SMTP_FROM } : config.smtp;
async function enviaEmail(para, assunto, texto) {
  if (!SMTP || !SMTP.host) return false;
  const nodemailer = require('nodemailer');
  const t = nodemailer.createTransport({ host: SMTP.host, port: SMTP.port || 587, secure: !!SMTP.secure, auth: SMTP.user ? { user: SMTP.user, pass: SMTP.pass } : undefined });
  await t.sendMail({ from: SMTP.from || SMTP.user, to: para, subject: assunto, text: texto });
  return true;
}
const uid = () => crypto.randomBytes(9).toString('base64url');

/* ---------- utilitários ---------- */
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const bad = (msg, status) => new HttpError(status || 400, msg);
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
const slug = s => norm(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'produto';
const okMail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const linhasArr = (v, maxItens, maxLen) => (Array.isArray(v) ? v : String(v || '').split(/\n+/)).map(x => str(x, maxLen)).filter(Boolean).slice(0, maxItens);

function hashSenha(senha, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  return { salt, hash: crypto.scryptSync(senha, salt, 64).toString('hex') };
}
function confereSenha(user, senha) {
  const h = Buffer.from(crypto.scryptSync(senha, user.salt, 64).toString('hex'));
  const o = Buffer.from(user.hash);
  return h.length === o.length && crypto.timingSafeEqual(h, o);
}
const sha = t => crypto.createHash('sha256').update(t).digest('hex');

function cookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); });
  return out;
}
function userFromReq(req) {
  const t = cookies(req).er_sid; if (!t) return null;
  const s = db.sessions[sha(t)];
  if (!s || s.exp < Date.now()) return null;
  return db.users.find(u => u.id === s.uid) || null;
}
function startSession(res, u) {
  const t = crypto.randomBytes(32).toString('base64url');
  const agora = Date.now();
  Object.keys(db.sessions).forEach(k => { if (db.sessions[k].exp < agora) delete db.sessions[k]; });
  db.sessions[sha(t)] = { uid: u.id, exp: agora + SESSAO_MS };
  res.setHeader('Set-Cookie', `er_sid=${t}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSAO_MS / 1000}`);
}

const tentativas = new Map();
function limitaLogin(chave) {
  const agora = Date.now(), r = tentativas.get(chave) || { n: 0, ate: agora + 10 * 60 * 1000 };
  if (r.ate < agora) { r.n = 0; r.ate = agora + 10 * 60 * 1000; }
  r.n++; tentativas.set(chave, r);
  if (r.n > 8) throw bad('Muitas tentativas. Espere alguns minutos e tente de novo.', 429);
}

/* ---------- Pix (BR Code estático) ---------- */
function crc16(s) {
  let crc = 0xFFFF;
  for (let i = 0; i < s.length; i++) { crc ^= s.charCodeAt(i) << 8; for (let j = 0; j < 8; j++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF; }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
const tlv = (id, v) => id + String(v.length).padStart(2, '0') + v;
function brCode({ chave, valorCent, nome, cidade, txid }) {
  const limpa = (t, n) => norm(t).toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim().slice(0, n) || 'NA';
  const corpo = tlv('00', '01') + tlv('01', '12') +
    tlv('26', tlv('00', 'br.gov.bcb.pix') + tlv('01', chave)) +
    tlv('52', '0000') + tlv('53', '986') + tlv('54', (valorCent / 100).toFixed(2)) + tlv('58', 'BR') +
    tlv('59', limpa(nome, 25)) + tlv('60', limpa(cidade || 'BRASIL', 15)) +
    tlv('62', tlv('05', txid.replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***')) + '6304';
  return corpo + crc16(corpo);
}
function cpfOk(c) {
  if (!/^\d{11}$/.test(c) || /^(\d)\1+$/.test(c)) return false;
  for (const n of [9, 10]) { let s = 0; for (let i = 0; i < n; i++) s += +c[i] * (n + 1 - i); const d = (s * 10) % 11 % 10; if (d !== +c[n]) return false; }
  return true;
}
function cnpjOk(c) {
  if (!/^\d{14}$/.test(c) || /^(\d)\1+$/.test(c)) return false;
  for (const n of [12, 13]) { let s = 0, p = n - 7; for (let i = 0; i < n; i++) { s += +c[i] * p--; if (p < 2) p = 9; } const d = s % 11 < 2 ? 0 : 11 - (s % 11); if (d !== +c[n]) return false; }
  return true;
}
function normalizaPix(tipo, chave) {
  chave = str(chave, 80);
  if (tipo === 'cpf') { const d = chave.replace(/\D/g, ''); if (!cpfOk(d)) throw bad('CPF da chave Pix inválido.'); return d; }
  if (tipo === 'cnpj') { const d = chave.replace(/\D/g, ''); if (!cnpjOk(d)) throw bad('CNPJ da chave Pix inválido.'); return d; }
  if (tipo === 'celular') { let d = chave.replace(/\D/g, ''); if (d.startsWith('55') && d.length > 11) d = d.slice(2); if (!/^\d{10,11}$/.test(d)) throw bad('Celular da chave Pix inválido. Use DDD + número.'); return '+55' + d; }
  if (tipo === 'email') { if (!okMail(chave) || chave.length > 77) throw bad('E-mail da chave Pix inválido.'); return chave.toLowerCase(); }
  if (tipo === 'aleatoria') { if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chave)) throw bad('Chave aleatória inválida. Copie o código completo do seu banco.'); return chave.toLowerCase(); }
  throw bad('Escolha o tipo da chave Pix.');
}

/* ---------- visões públicas ---------- */
const pubUser = u => ({ id: u.id, nome: u.nome, email: u.email, bio: u.bio || '', cidade: u.cidade || '', pixTipo: u.pixTipo || '', pixChave: u.pixChave || '', temPix: !!u.pixChave });
const centro = c => c / 100;
const pagos = o => o.status === 'pago' || o.status === 'reembolso_pedido';

function resumoProduto(p) {
  const autor = db.users.find(u => u.id === p.autorId);
  const av = db.reviews.filter(r => r.pid === p.id);
  const vendas = db.orders.filter(o => o.pid === p.id && pagos(o)).length;
  return {
    id: p.id, titulo: p.titulo, sub: p.sub, autor: autor ? autor.nome : 'Autor', autorId: p.autorId, cat: p.cat, tipo: p.tipo,
    preco: centro(p.precoCent), capa: p.capa, status: p.status, criado: p.criado,
    formatos: p.arquivos.map(a => [a.ext.toUpperCase(), a.tam]), novo: Date.now() - p.criado < 14 * 86400000,
    nota: av.length ? av.reduce((s, r) => s + r.nota, 0) / av.length : 0, aval: av.length, vendas
  };
}
function nomeCurto(n) { const p = n.trim().split(/\s+/); return p.length > 1 ? p[0] + ' ' + p[p.length - 1][0] + '.' : p[0]; }
function detalheProduto(p) {
  const autor = db.users.find(u => u.id === p.autorId);
  const avaliacoes = db.reviews.filter(r => r.pid === p.id).sort((a, b) => b.criado - a.criado).map(r => ({ nome: r.nome, cidade: r.cidade || '', nota: r.nota, texto: r.texto, criado: r.criado }));
  return Object.assign(resumoProduto(p), {
    desc: p.desc, trecho: p.amostra || [], sumario: p.sumario || [], garantia: p.garantia, bio: autor ? autor.bio || '' : '', avaliacoes,
    dist: [5, 4, 3, 2, 1].map(n => avaliacoes.filter(a => a.nota === n).length)
  });
}
const arquivosDe = p => p.arquivos.map(a => ({ fid: a.fid, nome: a.nome, ext: a.ext, tam: a.tam }));

function pedidoView(o, u) {
  const p = db.products.find(x => x.id === o.pid);
  const v = {
    id: o.id, pid: o.pid, status: o.status, valor: centro(o.valorCent), criado: o.criado, pagoEm: o.pagoEm || null, avisoPago: !!o.avisoPago,
    titulo: o.titulo, autor: o.autorNome, capa: p ? p.capa : o.capa, garantia: o.garantia, reembolso: o.reembolso || null,
    formatos: p ? p.arquivos.map(a => [a.ext.toUpperCase(), a.tam]) : []
  };
  if (o.status === 'aguardando') v.pix = brCode({ chave: o.pixChave, valorCent: o.valorCent, nome: o.pixNome, cidade: o.pixCidade, txid: o.id });
  if (o.status === 'aguardando' && p) v.pixChave = o.pixChave;
  if (p && pagos(o) && u && o.uid === u.id) v.arquivos = arquivosDe(p);
  if (u && p && p.autorId === u.id) { v.comprador = o.compradorNome; v.compradorEmail = o.compradorEmail; }
  if (u && o.uid === u.id) { v.reviewed = db.reviews.some(r => r.pid === o.pid && r.uid === u.id); }
  return v;
}

/* ---------- validação de produto ---------- */
function validaProduto(b, u, existente) {
  const titulo = str(b.titulo, 60), sub = str(b.sub, 110), desc = linhasArr(b.desc, 12, 2000);
  if (titulo.length < 3) throw bad('Escreva um título com pelo menos 3 letras.');
  if (!CATEGORIAS.includes(b.cat)) throw bad('Escolha um assunto.');
  if (!TIPOS.includes(b.tipo)) throw bad('Escolha o tipo de produto.');
  if (desc.join(' ').length < 20) throw bad('A descrição precisa ter ao menos 20 caracteres.');
  const precoCent = Math.round(Number(b.preco) * 100);
  if (!Number.isFinite(precoCent) || precoCent < PRECO_MIN) throw bad('O preço mínimo é R$ 5,00.');
  if (precoCent > PRECO_MAX) throw bad('O preço máximo é R$ 1.000,00.');
  const garantia = [7, 15, 30].includes(+b.garantia) ? +b.garantia : 7;
  const c = b.capa || {};
  const hex = x => /^#[0-9a-fA-F]{6}$/.test(x);
  if (!MOTIVOS.includes(c.motif) || !hex(c.bg) || !hex(c.fg) || !hex(c.ac)) throw bad('Capa inválida.');
  const ids = Array.isArray(b.arquivos) ? b.arquivos : [];
  if (!ids.length) throw bad('Envie pelo menos um arquivo.');
  const arquivos = ids.slice(0, 20).map(fid => {
    const f = db.files[fid];
    if (!f || f.uid !== u.id || (f.pid && (!existente || f.pid !== existente.id))) throw bad('Um dos arquivos não foi encontrado. Envie de novo.');
    return { fid, nome: f.nome, ext: f.ext, tam: f.tamTxt };
  });
  return { titulo, sub, cat: b.cat, tipo: b.tipo, desc, precoCent, garantia, capa: { motif: c.motif, bg: c.bg, fg: c.fg, ac: c.ac }, arquivos, amostra: linhasArr(b.amostra, 8, 1500), sumario: linhasArr(b.sumario, 40, 120) };
}
function ligaArquivos(p) { p.arquivos.forEach(a => { db.files[a.fid].pid = p.id; }); }
function soltaArquivos(p, novos) {
  const manter = new Set(novos.map(a => a.fid));
  p.arquivos.forEach(a => { if (!manter.has(a.fid)) apagaArquivo(a.fid); });
}
function apagaArquivo(fid) { delete db.files[fid]; try { fs.rmSync(path.join(FILES_DIR, fid), { force: true }); } catch (e) { /* já removido */ } }
const tamTxt = b => b >= 1e6 ? (b / 1e6).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB';

/* ---------- rotas ---------- */
const routes = [];
const route = (method, pattern, handler, opts) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), handler, opts: opts || {} });
const exigeLogin = u => { if (!u) throw bad('Entre na sua conta para continuar.', 401); return u; };

route('POST', '/api/cadastro', async ({ body, res }) => {
  const nome = str(body.nome, 80), email = str(body.email, 120).toLowerCase(), senha = typeof body.senha === 'string' ? body.senha : '';
  if (nome.length < 2) throw bad('Escreva seu nome.');
  if (!okMail(email)) throw bad('Esse e-mail parece incompleto. Confira o @ e o final, como .com.br.');
  if (senha.length < 8 || senha.length > 200) throw bad('A senha precisa ter 8 caracteres ou mais.');
  if (db.users.some(u => u.email === email)) throw bad('Já existe uma conta com esse e-mail. Entre com a sua senha.', 409);
  const { salt, hash } = hashSenha(senha);
  const u = { id: uid(), nome, email, salt, hash, bio: '', cidade: '', pixTipo: '', pixChave: '', criado: Date.now() };
  db.users.push(u); startSession(res, u); save();
  return { usuario: pubUser(u) };
});
route('POST', '/api/entrar', async ({ body, res, req }) => {
  const email = str(body.email, 120).toLowerCase(), senha = typeof body.senha === 'string' ? body.senha : '';
  limitaLogin(req.socket.remoteAddress + '|' + email);
  const u = db.users.find(x => x.email === email);
  if (!u || !senha || !confereSenha(u, senha)) throw bad('E-mail ou senha incorretos.', 401);
  startSession(res, u); save();
  return { usuario: pubUser(u) };
});
route('POST', '/api/sair', async ({ req, res }) => {
  const t = cookies(req).er_sid; if (t) { delete db.sessions[sha(t)]; save(); }
  res.setHeader('Set-Cookie', 'er_sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  return { ok: true };
});
const RESET_MS = 60 * 60 * 1000;
route('POST', '/api/esqueci', async ({ body, req, query }) => {
  const email = str(body.email, 120).toLowerCase();
  if (!okMail(email)) throw bad('Digite o e-mail da sua conta.');
  limitaLogin('esqueci|' + req.socket.remoteAddress + '|' + email);
  const u = db.users.find(x => x.email === email);
  if (u) {
    const token = crypto.randomBytes(32).toString('base64url');
    Object.keys(db.resets).forEach(k => { if (db.resets[k].exp < Date.now() || db.resets[k].uid === u.id) delete db.resets[k]; });
    db.resets[sha(token)] = { uid: u.id, exp: Date.now() + RESET_MS };
    save();
    const base = (config.baseUrl || process.env.BASE_URL || ('http://' + (req.headers.host || 'localhost:3000'))).replace(/\/$/, '');
    const link = base + '/redefinir.html?token=' + token;
    let enviado = false;
    try { enviado = await enviaEmail(u.email, 'Redefinir sua senha na entre linhas', `Olá, ${u.nome.split(' ')[0]}.

Para criar uma nova senha, abra o link abaixo. Ele vale por 1 hora.

${link}

Se não foi você, ignore esta mensagem.`); }
    catch (e) { console.error('Falha ao enviar e-mail de redefinição:', e.message); }
    if (!enviado) console.log(`
[redefinição de senha] E-mail não configurado. Link para ${u.email}:
${link}
`);
  }
  return { ok: true, emailConfigurado: !!(SMTP && SMTP.host) };
});
route('POST', '/api/redefinir', async ({ body, res }) => {
  const r = db.resets[sha(String(body.token || ''))];
  if (!r || r.exp < Date.now()) throw bad('Este link expirou ou já foi usado. Peça um novo em "Esqueci a senha".', 410);
  const senha = typeof body.senha === 'string' ? body.senha : '';
  if (senha.length < 8 || senha.length > 200) throw bad('A senha precisa ter 8 caracteres ou mais.');
  const u = db.users.find(x => x.id === r.uid);
  if (!u) throw bad('Conta não encontrada.', 404);
  Object.assign(u, hashSenha(senha));
  delete db.resets[sha(body.token)];
  Object.keys(db.sessions).forEach(k => { if (db.sessions[k].uid === u.id) delete db.sessions[k]; });
  startSession(res, u); save();
  return { usuario: pubUser(u) };
});
route('GET', '/api/eu', async ({ user }) => ({ usuario: user ? pubUser(user) : null }));
route('PUT', '/api/eu', async ({ user, body }) => {
  exigeLogin(user);
  const nome = str(body.nome, 80); if (nome.length < 2) throw bad('Escreva seu nome.');
  user.nome = nome; user.bio = str(body.bio, 600); user.cidade = str(body.cidade, 15);
  if (body.pixChave) { user.pixTipo = body.pixTipo; user.pixChave = normalizaPix(body.pixTipo, body.pixChave); }
  else if (body.pixChave === '' ) { user.pixTipo = ''; user.pixChave = ''; }
  save(); return { usuario: pubUser(user) };
});
route('PUT', '/api/eu/senha', async ({ user, body }) => {
  exigeLogin(user);
  if (!confereSenha(user, String(body.atual || ''))) throw bad('A senha atual está incorreta.', 403);
  const nova = String(body.nova || ''); if (nova.length < 8 || nova.length > 200) throw bad('A nova senha precisa ter 8 caracteres ou mais.');
  Object.assign(user, hashSenha(nova));
  save(); return { ok: true };
});

/* catálogo público */
route('GET', '/api/produtos', async () => ({ produtos: db.products.filter(p => p.status === 'publicado').map(resumoProduto) }));
route('GET', '/api/produtos/:id', async ({ params, user }) => {
  const p = db.products.find(x => x.id === params.id);
  if (!p || (p.status !== 'publicado' && !(user && user.id === p.autorId))) throw bad('Produto não encontrado.', 404);
  const d = detalheProduto(p);
  if (user) {
    d.possui = db.orders.some(o => o.uid === user.id && o.pid === p.id && pagos(o));
    d.meu = user.id === p.autorId;
    const minha = db.reviews.find(r => r.pid === p.id && r.uid === user.id); if (minha) d.minhaAvaliacao = { nota: minha.nota, texto: minha.texto };
  }
  return { produto: d };
});

/* área do autor */
route('GET', '/api/meus-produtos/:id', async ({ params, user }) => {
  exigeLogin(user);
  const p = db.products.find(x => x.id === params.id && x.autorId === user.id);
  if (!p) throw bad('Produto não encontrado.', 404);
  return { produto: Object.assign(detalheProduto(p), { arquivos: arquivosDe(p), precoNum: centro(p.precoCent), descTexto: p.desc.join('\n\n') }) };
});
route('POST', '/api/produtos', async ({ user, body }) => {
  exigeLogin(user);
  const d = validaProduto(body, user);
  if (!user.pixChave) throw bad('Cadastre sua chave Pix antes de publicar. É nela que você recebe.', 409);
  let id = slug(d.titulo); if (db.products.some(p => p.id === id)) id += '-' + uid().slice(0, 4).toLowerCase().replace(/[^a-z0-9]/g, 'x');
  const p = Object.assign({ id, autorId: user.id, status: 'publicado', criado: Date.now() }, d);
  db.products.push(p); ligaArquivos(p); save();
  return { produto: resumoProduto(p) };
});
route('PUT', '/api/produtos/:id', async ({ user, body, params }) => {
  exigeLogin(user);
  const p = db.products.find(x => x.id === params.id && x.autorId === user.id);
  if (!p) throw bad('Produto não encontrado.', 404);
  const d = validaProduto(body, user, p);
  soltaArquivos(p, d.arquivos);
  Object.assign(p, d); ligaArquivos(p); save();
  return { produto: resumoProduto(p) };
});
route('POST', '/api/produtos/:id/status', async ({ user, body, params }) => {
  exigeLogin(user);
  const p = db.products.find(x => x.id === params.id && x.autorId === user.id);
  if (!p) throw bad('Produto não encontrado.', 404);
  if (!['publicado', 'rascunho'].includes(body.status)) throw bad('Situação inválida.');
  if (body.status === 'publicado' && !user.pixChave) throw bad('Cadastre sua chave Pix antes de publicar.', 409);
  p.status = body.status; save(); return { produto: resumoProduto(p) };
});
route('DELETE', '/api/produtos/:id', async ({ user, params }) => {
  exigeLogin(user);
  const p = db.products.find(x => x.id === params.id && x.autorId === user.id);
  if (!p) throw bad('Produto não encontrado.', 404);
  if (db.orders.some(o => o.pid === p.id)) throw bad('Este produto já tem pedidos. Despublique em vez de apagar, para os compradores manterem o acesso.', 409);
  p.arquivos.forEach(a => apagaArquivo(a.fid));
  db.products = db.products.filter(x => x !== p); db.reviews = db.reviews.filter(r => r.pid !== p.id); save();
  return { ok: true };
});
route('GET', '/api/vendedor', async ({ user }) => {
  exigeLogin(user);
  const meus = db.products.filter(p => p.autorId === user.id), ids = new Set(meus.map(p => p.id));
  const pedidos = db.orders.filter(o => ids.has(o.pid)).sort((a, b) => b.criado - a.criado).slice(0, 500).map(o => pedidoView(o, user));
  const receita = {}; db.orders.forEach(o => { if (ids.has(o.pid) && o.status === 'pago') receita[o.pid] = (receita[o.pid] || 0) + o.valorCent; });
  return {
    produtos: meus.map(p => Object.assign(resumoProduto(p), { receita: centro(receita[p.id] || 0), pedidos: db.orders.filter(o => o.pid === p.id).length })).sort((a, b) => b.criado - a.criado),
    pedidos,
    avaliacoes: db.reviews.filter(r => ids.has(r.pid)).sort((a, b) => b.criado - a.criado).slice(0, 8).map(r => ({ nome: r.nome, nota: r.nota, texto: r.texto, titulo: meus.find(p => p.id === r.pid).titulo, criado: r.criado }))
  };
});

/* arquivos */
route('POST', '/api/arquivos', async ({ req, user, query }) => {
  exigeLogin(user);
  const nome = str(query.get('nome') || '', 160).replace(/[\\/:*?"<>|\x00-\x1f]/g, '_');
  const ext = (nome.split('.').pop() || '').toLowerCase();
  if (!EXT_OK[ext]) throw bad('Formato não aceito. Use PDF, EPUB, MP4, MP3, ZIP ou XLSX.');
  const len = +req.headers['content-length'] || 0;
  if (len > MAX_UPLOAD) throw bad('O arquivo passa de 500 MB.', 413);
  if (len === 0) throw bad('O arquivo está vazio.');
  const fid = uid() + crypto.randomBytes(4).toString('hex');
  const alvo = path.join(FILES_DIR, fid);
  let total = 0;
  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(alvo);
    req.on('data', c => { total += c.length; if (total > MAX_UPLOAD) { req.destroy(); out.destroy(); reject(bad('O arquivo passa de 500 MB.', 413)); } });
    req.on('aborted', () => { out.destroy(); reject(bad('Envio interrompido.')); });
    req.pipe(out); out.on('finish', resolve); out.on('error', reject);
  }).catch(e => { fs.rm(alvo, { force: true }, () => {}); throw e; });
  db.files[fid] = { uid: user.id, nome, ext, tam: total, tamTxt: tamTxt(total), criado: Date.now(), pid: null };
  save();
  return { arquivo: { fid, nome, ext, tam: tamTxt(total) } };
}, { raw: true });
route('DELETE', '/api/arquivos/:fid', async ({ user, params }) => {
  exigeLogin(user);
  const f = db.files[params.fid];
  if (!f || f.uid !== user.id || f.pid) throw bad('Arquivo não encontrado.', 404);
  apagaArquivo(params.fid); save(); return { ok: true };
});
function podeBaixar(u, fid) {
  const f = db.files[fid]; if (!f || !u) return false;
  if (f.uid === u.id) return true;
  return db.orders.some(o => o.uid === u.id && pagos(o) && db.products.some(p => p.id === o.pid && p.arquivos.some(a => a.fid === fid)));
}
route('GET', '/api/arquivos/:fid', async ({ req, res, user, params, query }) => {
  if (!user) throw bad('Entre na sua conta para baixar.', 401);
  if (!podeBaixar(user, params.fid)) throw bad('Você não tem acesso a este arquivo.', 403);
  const f = db.files[params.fid], alvo = path.join(FILES_DIR, params.fid);
  let st; try { st = fs.statSync(alvo); } catch (e) { throw bad('Arquivo indisponível.', 404); }
  const inline = INLINE_OK.has(f.ext) && query.get('baixar') !== '1';
  const h = { 'Content-Type': EXT_OK[f.ext], 'Accept-Ranges': 'bytes', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store', 'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${norm(f.nome).replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(f.nome)}` };
  let ini = 0, fim = st.size - 1, status = 200;
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (m && (m[1] || m[2])) {
    if (m[1]) { ini = +m[1]; if (m[2]) fim = Math.min(+m[2], fim); } else { ini = Math.max(0, st.size - +m[2]); }
    if (ini > fim || ini >= st.size) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); res.end(); return RAW; }
    status = 206; h['Content-Range'] = `bytes ${ini}-${fim}/${st.size}`;
  }
  h['Content-Length'] = fim - ini + 1;
  res.writeHead(status, h);
  fs.createReadStream(alvo, { start: ini, end: fim }).pipe(res);
  return RAW;
});

/* pedidos */
const ESPERA_MAX = 20;
route('POST', '/api/pedidos', async ({ user, body }) => {
  exigeLogin(user);
  const p = db.products.find(x => x.id === body.pid && x.status === 'publicado');
  if (!p) throw bad('Produto não encontrado.', 404);
  if (p.autorId === user.id) throw bad('Este produto é seu. Você já tem acesso aos arquivos no painel.', 409);
  if (db.orders.some(o => o.uid === user.id && o.pid === p.id && pagos(o))) throw bad('Você já comprou este produto. Ele está na sua estante.', 409);
  const aberto = db.orders.find(o => o.uid === user.id && o.pid === p.id && o.status === 'aguardando');
  if (aberto) return { pedido: pedidoView(aberto, user) };
  if (db.orders.filter(o => o.uid === user.id && o.status === 'aguardando').length >= ESPERA_MAX) throw bad('Você tem pedidos demais aguardando pagamento. Cancele alguns na estante.', 429);
  const autor = db.users.find(u => u.id === p.autorId);
  if (!autor || !autor.pixChave) throw bad('O autor ainda não configurou o recebimento. Tente mais tarde.', 409);
  db.seq++;
  const o = {
    id: 'EL-' + String(db.seq).padStart(6, '0'), uid: user.id, pid: p.id, valorCent: p.precoCent, status: 'aguardando', criado: Date.now(),
    titulo: p.titulo, autorNome: autor.nome, capa: p.capa, garantia: p.garantia, compradorNome: user.nome, compradorEmail: user.email,
    pixChave: autor.pixChave, pixNome: autor.nome, pixCidade: autor.cidade
  };
  db.orders.push(o); save();
  return { pedido: pedidoView(o, user) };
});
function pedidoDoComprador(user, id) {
  exigeLogin(user);
  const o = db.orders.find(x => x.id === id && x.uid === user.id);
  if (!o) throw bad('Pedido não encontrado.', 404);
  return o;
}
function pedidoDoVendedor(user, id) {
  exigeLogin(user);
  const o = db.orders.find(x => x.id === id);
  const p = o && db.products.find(x => x.id === o.pid);
  if (!o || !p || p.autorId !== user.id) throw bad('Pedido não encontrado.', 404);
  return o;
}
route('GET', '/api/pedidos/:id', async ({ user, params }) => {
  exigeLogin(user);
  const o = db.orders.find(x => x.id === params.id), p = o && db.products.find(x => x.id === o.pid);
  if (!o || !(o.uid === user.id || (p && p.autorId === user.id))) throw bad('Pedido não encontrado.', 404);
  return { pedido: pedidoView(o, user) };
});
route('POST', '/api/pedidos/:id/avisar', async ({ user, params }) => {
  const o = pedidoDoComprador(user, params.id);
  if (o.status !== 'aguardando') throw bad('Este pedido não está mais aguardando pagamento.', 409);
  o.avisoPago = true; o.avisoEm = Date.now(); save(); return { pedido: pedidoView(o, user) };
});
route('POST', '/api/pedidos/:id/cancelar', async ({ user, params }) => {
  const o = pedidoDoComprador(user, params.id);
  if (o.status !== 'aguardando') throw bad('Só dá para cancelar pedidos que ainda não foram pagos.', 409);
  o.status = 'cancelado'; save(); return { pedido: pedidoView(o, user) };
});
route('POST', '/api/pedidos/:id/confirmar', async ({ user, params }) => {
  const o = pedidoDoVendedor(user, params.id);
  if (o.status !== 'aguardando') throw bad('Este pedido não está aguardando pagamento.', 409);
  o.status = 'pago'; o.pagoEm = Date.now(); save(); return { pedido: pedidoView(o, user) };
});
route('POST', '/api/pedidos/:id/reembolso', async ({ user, params, body }) => {
  const o = pedidoDoComprador(user, params.id);
  if (o.status !== 'pago') throw bad('Só dá para pedir reembolso de compras pagas e sem pedido em andamento.', 409);
  if (Date.now() > o.pagoEm + o.garantia * 86400000) throw bad(`O prazo de ${o.garantia} dias de garantia já passou.`, 409);
  o.status = 'reembolso_pedido'; o.reembolso = { pedidoEm: Date.now(), motivo: str(body.motivo, 400) }; save();
  return { pedido: pedidoView(o, user) };
});
route('POST', '/api/pedidos/:id/reembolso/decidir', async ({ user, params, body }) => {
  const o = pedidoDoVendedor(user, params.id);
  if (o.status !== 'reembolso_pedido') throw bad('Não há pedido de reembolso para este pedido.', 409);
  if (body.aprovar) { o.status = 'reembolsado'; o.reembolso.decididoEm = Date.now(); o.reembolso.aprovado = true; }
  else { o.status = 'pago'; o.reembolso.decididoEm = Date.now(); o.reembolso.aprovado = false; }
  save(); return { pedido: pedidoView(o, user) };
});
route('GET', '/api/estante', async ({ user }) => {
  exigeLogin(user);
  return { pedidos: db.orders.filter(o => o.uid === user.id && o.status !== 'cancelado').sort((a, b) => b.criado - a.criado).map(o => pedidoView(o, user)) };
});

/* avaliações */
route('POST', '/api/produtos/:id/avaliacao', async ({ user, params, body }) => {
  exigeLogin(user);
  if (!db.orders.some(o => o.uid === user.id && o.pid === params.id && o.status === 'pago')) throw bad('Só quem comprou pode avaliar.', 403);
  const nota = Math.round(+body.nota), texto = str(body.texto, 600);
  if (!(nota >= 1 && nota <= 5)) throw bad('Escolha uma nota de 1 a 5.');
  if (texto.length < 3) throw bad('Escreva pelo menos uma frase.');
  let r = db.reviews.find(x => x.pid === params.id && x.uid === user.id);
  if (r) Object.assign(r, { nota, texto, criado: Date.now() });
  else db.reviews.push(r = { id: uid(), pid: params.id, uid: user.id, nome: nomeCurto(user.nome), cidade: user.cidade || '', nota, texto, criado: Date.now() });
  save(); return { ok: true };
});

/* ---------- servidor ---------- */
const RAW = Symbol('raw');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const PAGINAS = new Set(['index', 'catalogo', 'produto', 'checkout', 'obrigado', 'biblioteca', 'entrar', 'painel', 'novo-produto', 'conta', 'redefinir', 'estilo']);

function sendJSON(res, status, obj) {
  const b = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(b), 'Cache-Control': 'no-store' });
  res.end(b);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let n = 0; const chunks = [];
    req.on('data', c => { n += c.length; if (n > 1e6) { reject(bad('Requisição grande demais.', 413)); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { if (!n) return resolve({}); try { const j = JSON.parse(Buffer.concat(chunks).toString('utf8')); resolve(j && typeof j === 'object' ? j : {}); } catch (e) { reject(bad('Requisição inválida.')); } });
    req.on('error', reject);
  });
}
async function handleApi(req, res, url) {
  const r = routes.find(x => x.method === req.method && x.re.test(url.pathname));
  if (!r) return sendJSON(res, 404, { erro: 'Rota não encontrada.' });
  if (req.method !== 'GET' && req.headers['x-er'] !== '1') return sendJSON(res, 403, { erro: 'Requisição recusada.' });
  try {
    const params = Object.assign({}, r.re.exec(url.pathname).groups);
    const body = r.opts.raw || req.method === 'GET' || req.method === 'DELETE' ? {} : await readBody(req);
    const out = await r.handler({ req, res, user: userFromReq(req), params, body, query: url.searchParams });
    if (out !== RAW) sendJSON(res, 200, out);
  } catch (e) {
    if (e instanceof HttpError) { if (!res.headersSent) sendJSON(res, e.status, { erro: e.message }); else res.destroy(); }
    else { console.error(e); if (!res.headersSent) sendJSON(res, 500, { erro: 'Algo deu errado do nosso lado. Tente de novo.' }); }
  }
}
function serveStatic(req, res, url) {
  let p; try { p = decodeURIComponent(url.pathname); } catch (e) { p = ''; }
  if (p === '/') p = '/index.html';
  const m = /^\/([a-z0-9-]+)\.html$/.exec(p);
  let file = null;
  if (m && PAGINAS.has(m[1])) file = path.join(ROOT, m[1] + '.html');
  else if (/^\/(css|js)\/[A-Za-z0-9_\-./]+$/.test(p) && !p.includes('..')) file = path.join(ROOT, p);
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end('<!doctype html><meta charset="utf-8"><title>Não encontrada</title><body style="font-family:Georgia,serif;max-width:40ch;margin:15vh auto;padding:0 16px"><h1>Página não encontrada</h1><p><a href="/">Voltar ao início</a></p>');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/api/')) handleApi(req, res, url);
  else if (req.method === 'GET' || req.method === 'HEAD') serveStatic(req, res, url);
  else { res.writeHead(405); res.end(); }
});

if (require.main === module) {
  save(); // garante que o banco exista em disco desde a primeira execução
  const port = +process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`entre linhas rodando em http://localhost:${port}`);
    console.log(`Banco de dados: ${DB_FILE} (${db.users.length} contas, ${db.products.length} produtos)`);
    console.log(SMTP && SMTP.host ? 'E-mail de recuperação de senha: configurado.' : 'E-mail de recuperação de senha: NÃO configurado (o link aparece aqui no terminal). Veja o README.');
  });
}
module.exports = { server, brCode, crc16 };
