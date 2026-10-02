const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { ApiError, obrigatorio, emailValido, cpfCnpjValido } = require('../middleware/validate');

const router = express.Router();
const PERFIS = ['cliente', 'autor', 'administrador'];

// remove a senha antes de devolver qualquer usuário na resposta
function semSenha(usuario) {
  const { senha_hash, ...resto } = usuario;
  return resto;
}

// GET /api/usuarios?perfil=cliente&ativo=true
router.get('/', async (req, res, next) => {
  try {
    const condicoes = [];
    const params = [];
    if (req.query.perfil) { condicoes.push('perfil = ?'); params.push(req.query.perfil); }
    if (req.query.ativo !== undefined) { condicoes.push('ativo = ?'); params.push(req.query.ativo === 'true' ? 1 : 0); }
    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const [linhas] = await pool.query(
      `SELECT id_usuario, nome, email, cpf_cnpj, telefone, perfil, ativo, data_cadastro FROM usuario ${where} ORDER BY nome`,
      params
    );
    res.json(linhas);
  } catch (err) { next(err); }
});

// GET /api/usuarios/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [linhas] = await pool.query('SELECT * FROM usuario WHERE id_usuario = ?', [req.params.id]);
    if (!linhas.length) throw new ApiError(404, 'Usuário não encontrado.');
    res.json(semSenha(linhas[0]));
  } catch (err) { next(err); }
});

// POST /api/usuarios (cadastro)
router.post('/', async (req, res, next) => {
  try {
    const { nome, email, senha, telefone } = req.body;
    obrigatorio(nome, 'nome');
    obrigatorio(email, 'email');
    obrigatorio(senha, 'senha');
    emailValido(email);
    const cpfCnpj = cpfCnpjValido(req.body.cpf_cnpj);
    const perfil = PERFIS.includes(req.body.perfil) ? req.body.perfil : 'cliente';
    if (String(senha).length < 6) throw new ApiError(400, 'A senha deve ter ao menos 6 caracteres.');

    const [dup] = await pool.query('SELECT id_usuario FROM usuario WHERE email = ? OR cpf_cnpj = ?', [email, cpfCnpj]);
    if (dup.length) throw new ApiError(409, 'Já existe um usuário com esse e-mail ou CPF/CNPJ.');

    const senha_hash = await bcrypt.hash(senha, 10);
    const [resultado] = await pool.query(
      'INSERT INTO usuario (nome, email, senha_hash, cpf_cnpj, telefone, perfil) VALUES (?, ?, ?, ?, ?, ?)',
      [nome, email, senha_hash, cpfCnpj, telefone || null, perfil]
    );
    res.status(201).json({ id_usuario: resultado.insertId, nome, email, cpf_cnpj: cpfCnpj, perfil, ativo: 1 });
  } catch (err) { next(err); }
});

// PUT /api/usuarios/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existentes] = await pool.query('SELECT * FROM usuario WHERE id_usuario = ?', [id]);
    if (!existentes.length) throw new ApiError(404, 'Usuário não encontrado.');
    const atual = existentes[0];

    const nome = req.body.nome ?? atual.nome;
    const email = req.body.email ?? atual.email;
    const telefone = req.body.telefone ?? atual.telefone;
    const perfil = req.body.perfil && PERFIS.includes(req.body.perfil) ? req.body.perfil : atual.perfil;
    const ativo = req.body.ativo !== undefined ? (req.body.ativo ? 1 : 0) : atual.ativo;
    const cpfCnpj = req.body.cpf_cnpj ? cpfCnpjValido(req.body.cpf_cnpj) : atual.cpf_cnpj;
    obrigatorio(nome, 'nome');
    obrigatorio(email, 'email');
    emailValido(email);

    const [dup] = await pool.query(
      'SELECT id_usuario FROM usuario WHERE (email = ? OR cpf_cnpj = ?) AND id_usuario <> ?',
      [email, cpfCnpj, id]
    );
    if (dup.length) throw new ApiError(409, 'Já existe outro usuário com esse e-mail ou CPF/CNPJ.');

    let senha_hash = atual.senha_hash;
    if (req.body.senha) {
      if (String(req.body.senha).length < 6) throw new ApiError(400, 'A senha deve ter ao menos 6 caracteres.');
      senha_hash = await bcrypt.hash(req.body.senha, 10);
    }

    await pool.query(
      `UPDATE usuario SET nome = ?, email = ?, senha_hash = ?, cpf_cnpj = ?, telefone = ?, perfil = ?, ativo = ?
        WHERE id_usuario = ?`,
      [nome, email, senha_hash, cpfCnpj, telefone, perfil, ativo, id]
    );
    res.json({ id_usuario: Number(id), nome, email, cpf_cnpj: cpfCnpj, perfil, ativo });
  } catch (err) { next(err); }
});

// DELETE /api/usuarios/:id -> inativação (pedidos antigos continuam referenciando o usuário)
router.delete('/:id', async (req, res, next) => {
  try {
    const [resultado] = await pool.query('UPDATE usuario SET ativo = 0 WHERE id_usuario = ?', [req.params.id]);
    if (!resultado.affectedRows) throw new ApiError(404, 'Usuário não encontrado.');
    res.json({ mensagem: 'Usuário inativado com sucesso.' });
  } catch (err) { next(err); }
});

// --- Endereços do usuário (necessários para o checkout) ---

// GET /api/usuarios/:id/enderecos
router.get('/:id/enderecos', async (req, res, next) => {
  try {
    const [linhas] = await pool.query('SELECT * FROM endereco WHERE id_usuario = ?', [req.params.id]);
    res.json(linhas);
  } catch (err) { next(err); }
});

// POST /api/usuarios/:id/enderecos
router.post('/:id/enderecos', async (req, res, next) => {
  try {
    const id_usuario = req.params.id;
    const [usuarios] = await pool.query('SELECT id_usuario FROM usuario WHERE id_usuario = ?', [id_usuario]);
    if (!usuarios.length) throw new ApiError(404, 'Usuário não encontrado.');

    const { rua, numero, bairro, cep, cidade, estado } = req.body;
    obrigatorio(rua, 'rua');
    obrigatorio(numero, 'numero');
    obrigatorio(bairro, 'bairro');
    obrigatorio(cep, 'cep');
    obrigatorio(cidade, 'cidade');
    obrigatorio(estado, 'estado');
    const cepDigitos = String(cep).replace(/\D/g, '');
    if (cepDigitos.length !== 8) throw new ApiError(400, 'CEP inválido: use 8 dígitos.');

    const [resultado] = await pool.query(
      `INSERT INTO endereco (id_usuario, apelido, rua, numero, complemento, bairro, cep, cidade, estado, tipo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_usuario, req.body.apelido || 'Principal', rua, numero, req.body.complemento || null,
        bairro, cepDigitos, cidade, estado.toUpperCase(), req.body.tipo || 'ambos']
    );
    res.status(201).json({ id_endereco: resultado.insertId, id_usuario: Number(id_usuario) });
  } catch (err) { next(err); }
});

module.exports = router;
