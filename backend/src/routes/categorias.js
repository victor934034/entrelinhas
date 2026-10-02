const express = require('express');
const pool = require('../db');
const { ApiError, obrigatorio } = require('../middleware/validate');

const router = express.Router();

function slugify(texto) {
  return String(texto)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET /api/categorias?ativo=true
router.get('/', async (req, res, next) => {
  try {
    const condicoes = [];
    const params = [];
    if (req.query.ativo !== undefined) {
      condicoes.push('ativo = ?');
      params.push(req.query.ativo === 'true' ? 1 : 0);
    }
    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const [linhas] = await pool.query(
      `SELECT id_categoria, nome_categoria, slug, descricao, ativo FROM categoria ${where} ORDER BY nome_categoria`,
      params
    );
    res.json(linhas);
  } catch (err) { next(err); }
});

// GET /api/categorias/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [linhas] = await pool.query('SELECT * FROM categoria WHERE id_categoria = ?', [req.params.id]);
    if (!linhas.length) throw new ApiError(404, 'Categoria não encontrada.');
    res.json(linhas[0]);
  } catch (err) { next(err); }
});

// POST /api/categorias
router.post('/', async (req, res, next) => {
  try {
    const { nome_categoria, descricao } = req.body;
    obrigatorio(nome_categoria, 'nome_categoria');
    const slug = req.body.slug ? slugify(req.body.slug) : slugify(nome_categoria);

    const [dup] = await pool.query(
      'SELECT id_categoria FROM categoria WHERE nome_categoria = ? OR slug = ?',
      [nome_categoria, slug]
    );
    if (dup.length) throw new ApiError(409, 'Já existe uma categoria com esse nome ou slug.');

    const [resultado] = await pool.query(
      'INSERT INTO categoria (nome_categoria, slug, descricao) VALUES (?, ?, ?)',
      [nome_categoria, slug, descricao || null]
    );
    const [[nova]] = [[{ id_categoria: resultado.insertId, nome_categoria, slug, descricao: descricao || null, ativo: 1 }]];
    res.status(201).json(nova);
  } catch (err) { next(err); }
});

// PUT /api/categorias/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existentes] = await pool.query('SELECT * FROM categoria WHERE id_categoria = ?', [id]);
    if (!existentes.length) throw new ApiError(404, 'Categoria não encontrada.');
    const atual = existentes[0];

    const nome_categoria = req.body.nome_categoria ?? atual.nome_categoria;
    const descricao = req.body.descricao ?? atual.descricao;
    const slug = req.body.slug ? slugify(req.body.slug) : atual.slug;
    const ativo = req.body.ativo !== undefined ? (req.body.ativo ? 1 : 0) : atual.ativo;
    obrigatorio(nome_categoria, 'nome_categoria');

    const [dup] = await pool.query(
      'SELECT id_categoria FROM categoria WHERE (nome_categoria = ? OR slug = ?) AND id_categoria <> ?',
      [nome_categoria, slug, id]
    );
    if (dup.length) throw new ApiError(409, 'Já existe outra categoria com esse nome ou slug.');

    await pool.query(
      'UPDATE categoria SET nome_categoria = ?, slug = ?, descricao = ?, ativo = ? WHERE id_categoria = ?',
      [nome_categoria, slug, descricao, ativo, id]
    );
    res.json({ id_categoria: Number(id), nome_categoria, slug, descricao, ativo });
  } catch (err) { next(err); }
});

// DELETE /api/categorias/:id -> inativação (produtos antigos continuam íntegros)
router.delete('/:id', async (req, res, next) => {
  try {
    const [resultado] = await pool.query('UPDATE categoria SET ativo = 0 WHERE id_categoria = ?', [req.params.id]);
    if (!resultado.affectedRows) throw new ApiError(404, 'Categoria não encontrada.');
    res.json({ mensagem: 'Categoria inativada com sucesso.' });
  } catch (err) { next(err); }
});

module.exports = router;
