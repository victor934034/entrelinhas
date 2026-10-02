const express = require('express');
const pool = require('../db');
const { ApiError, obrigatorio, precoValido, estoqueValido } = require('../middleware/validate');

const router = express.Router();

function slugify(texto) {
  return String(texto)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET /api/produtos?categoria=1&ativo=true&busca=python
router.get('/', async (req, res, next) => {
  try {
    const condicoes = [];
    const params = [];
    if (req.query.categoria) {
      condicoes.push('p.id_categoria = ?');
      params.push(req.query.categoria);
    }
    if (req.query.ativo !== undefined) {
      condicoes.push('p.ativo = ?');
      params.push(req.query.ativo === 'true' ? 1 : 0);
    }
    if (req.query.busca) {
      condicoes.push('p.nome_produto LIKE ?');
      params.push(`%${req.query.busca}%`);
    }
    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const [linhas] = await pool.query(
      `SELECT p.*, c.nome_categoria, u.nome AS nome_autor
         FROM produto p
         JOIN categoria c ON c.id_categoria = p.id_categoria
         JOIN usuario u ON u.id_usuario = p.id_autor
         ${where}
        ORDER BY p.data_cadastro DESC`,
      params
    );
    res.json(linhas);
  } catch (err) { next(err); }
});

// GET /api/produtos/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [linhas] = await pool.query(
      `SELECT p.*, c.nome_categoria, u.nome AS nome_autor
         FROM produto p
         JOIN categoria c ON c.id_categoria = p.id_categoria
         JOIN usuario u ON u.id_usuario = p.id_autor
        WHERE p.id_produto = ?`,
      [req.params.id]
    );
    if (!linhas.length) throw new ApiError(404, 'Produto não encontrado.');
    const [arquivos] = await pool.query(
      'SELECT id_arquivo, formato, tamanho_kb FROM produto_arquivo WHERE id_produto = ?',
      [req.params.id]
    );
    res.json({ ...linhas[0], arquivos });
  } catch (err) { next(err); }
});

// POST /api/produtos
router.post('/', async (req, res, next) => {
  try {
    const { id_categoria, id_autor, nome_produto, subtitulo, descricao, imagem_url } = req.body;
    obrigatorio(id_categoria, 'id_categoria');
    obrigatorio(id_autor, 'id_autor');
    obrigatorio(nome_produto, 'nome_produto');
    obrigatorio(descricao, 'descricao');
    obrigatorio(imagem_url, 'imagem_url');
    const preco = precoValido(req.body.preco_venda);
    const estoque = req.body.estoque_disponivel !== undefined ? estoqueValido(req.body.estoque_disponivel) : 0;
    const slug = req.body.slug ? slugify(req.body.slug) : slugify(nome_produto);

    const [categorias] = await pool.query('SELECT id_categoria FROM categoria WHERE id_categoria = ?', [id_categoria]);
    if (!categorias.length) throw new ApiError(400, 'Categoria informada não existe.');
    const [autores] = await pool.query('SELECT id_usuario FROM usuario WHERE id_usuario = ?', [id_autor]);
    if (!autores.length) throw new ApiError(400, 'Autor informado não existe.');
    const [dup] = await pool.query('SELECT id_produto FROM produto WHERE slug = ?', [slug]);
    if (dup.length) throw new ApiError(409, 'Já existe um produto com esse slug.');

    const [resultado] = await pool.query(
      `INSERT INTO produto (id_categoria, id_autor, slug, nome_produto, subtitulo, descricao, preco_venda, estoque_disponivel, imagem_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_categoria, id_autor, slug, nome_produto, subtitulo || null, descricao, preco, estoque, imagem_url]
    );
    res.status(201).json({ id_produto: resultado.insertId, slug, nome_produto, preco_venda: preco, estoque_disponivel: estoque });
  } catch (err) { next(err); }
});

// PUT /api/produtos/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existentes] = await pool.query('SELECT * FROM produto WHERE id_produto = ?', [id]);
    if (!existentes.length) throw new ApiError(404, 'Produto não encontrado.');
    const atual = existentes[0];

    const nome_produto = req.body.nome_produto ?? atual.nome_produto;
    const subtitulo = req.body.subtitulo ?? atual.subtitulo;
    const descricao = req.body.descricao ?? atual.descricao;
    const imagem_url = req.body.imagem_url ?? atual.imagem_url;
    const id_categoria = req.body.id_categoria ?? atual.id_categoria;
    const preco_venda = req.body.preco_venda !== undefined ? precoValido(req.body.preco_venda) : atual.preco_venda;
    const estoque_disponivel = req.body.estoque_disponivel !== undefined ? estoqueValido(req.body.estoque_disponivel) : atual.estoque_disponivel;
    const ativo = req.body.ativo !== undefined ? (req.body.ativo ? 1 : 0) : atual.ativo;
    obrigatorio(nome_produto, 'nome_produto');
    obrigatorio(descricao, 'descricao');

    if (req.body.id_categoria) {
      const [categorias] = await pool.query('SELECT id_categoria FROM categoria WHERE id_categoria = ?', [id_categoria]);
      if (!categorias.length) throw new ApiError(400, 'Categoria informada não existe.');
    }

    await pool.query(
      `UPDATE produto SET nome_produto = ?, subtitulo = ?, descricao = ?, imagem_url = ?,
              id_categoria = ?, preco_venda = ?, estoque_disponivel = ?, ativo = ?
        WHERE id_produto = ?`,
      [nome_produto, subtitulo, descricao, imagem_url, id_categoria, preco_venda, estoque_disponivel, ativo, id]
    );
    res.json({ id_produto: Number(id), nome_produto, preco_venda, estoque_disponivel, ativo });
  } catch (err) { next(err); }
});

// DELETE /api/produtos/:id -> inativação (pedidos antigos continuam referenciando o produto)
router.delete('/:id', async (req, res, next) => {
  try {
    const [resultado] = await pool.query('UPDATE produto SET ativo = 0 WHERE id_produto = ?', [req.params.id]);
    if (!resultado.affectedRows) throw new ApiError(404, 'Produto não encontrado.');
    res.json({ mensagem: 'Produto inativado com sucesso.' });
  } catch (err) { next(err); }
});

module.exports = router;
