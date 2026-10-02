const express = require('express');
const pool = require('../db');
const { ApiError, obrigatorio, inteiroPositivo } = require('../middleware/validate');

const router = express.Router();
const FORMAS_PAGAMENTO = ['pix', 'cartao', 'boleto'];
const STATUS_VALIDOS = ['Pendente', 'Pago', 'Enviado', 'Entregue', 'Cancelado'];

// GET /api/pedidos?usuario=2&status=Pago
router.get('/', async (req, res, next) => {
  try {
    const condicoes = [];
    const params = [];
    if (req.query.usuario) { condicoes.push('p.id_usuario = ?'); params.push(req.query.usuario); }
    if (req.query.status) { condicoes.push('p.status = ?'); params.push(req.query.status); }
    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const [linhas] = await pool.query(
      `SELECT p.*, u.nome AS nome_cliente
         FROM pedido p JOIN usuario u ON u.id_usuario = p.id_usuario
         ${where}
        ORDER BY p.data_pedido DESC`,
      params
    );
    res.json(linhas);
  } catch (err) { next(err); }
});

// GET /api/pedidos/:id (cabeçalho + itens)
router.get('/:id', async (req, res, next) => {
  try {
    const [cabecalhos] = await pool.query(
      `SELECT p.*, u.nome AS nome_cliente, e.rua, e.numero, e.bairro, e.cidade, e.estado, e.cep
         FROM pedido p
         JOIN usuario u ON u.id_usuario = p.id_usuario
         JOIN endereco e ON e.id_endereco = p.id_endereco
        WHERE p.id_pedido = ?`,
      [req.params.id]
    );
    if (!cabecalhos.length) throw new ApiError(404, 'Pedido não encontrado.');
    const [itens] = await pool.query(
      `SELECT i.*, pr.nome_produto
         FROM item_pedido i JOIN produto pr ON pr.id_produto = i.id_produto
        WHERE i.id_pedido = ?`,
      [req.params.id]
    );
    res.json({ ...cabecalhos[0], itens });
  } catch (err) { next(err); }
});

// POST /api/pedidos  (checkout)
// body: { id_usuario, id_endereco, forma_pagamento, itens: [{ id_produto, quantidade }] }
router.post('/', async (req, res, next) => {
  const { id_usuario, id_endereco, forma_pagamento, itens } = req.body;
  obrigatorio(id_usuario, 'id_usuario');
  obrigatorio(id_endereco, 'id_endereco');
  obrigatorio(forma_pagamento, 'forma_pagamento');
  if (!FORMAS_PAGAMENTO.includes(forma_pagamento)) {
    return next(new ApiError(400, `forma_pagamento deve ser uma de: ${FORMAS_PAGAMENTO.join(', ')}.`));
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    return next(new ApiError(400, 'O pedido precisa ter ao menos um item.'));
  }
  try {
    for (const item of itens) {
      inteiroPositivo(item.id_produto, 'id_produto');
      inteiroPositivo(item.quantidade, 'quantidade');
    }
  } catch (err) { return next(err); }

  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();

    // comprador precisa existir e estar ativo
    const [usuarios] = await conexao.query('SELECT id_usuario, ativo FROM usuario WHERE id_usuario = ?', [id_usuario]);
    if (!usuarios.length) throw new ApiError(404, 'Usuário não encontrado.');
    if (!usuarios[0].ativo) throw new ApiError(400, 'Usuário inativo não pode finalizar pedidos.');

    // o endereço precisa pertencer ao mesmo usuário (replica a FK composta do banco)
    const [enderecos] = await conexao.query(
      'SELECT id_endereco FROM endereco WHERE id_endereco = ? AND id_usuario = ?',
      [id_endereco, id_usuario]
    );
    if (!enderecos.length) throw new ApiError(400, 'Endereço informado não pertence a esse usuário.');

    // trava as linhas dos produtos (SELECT ... FOR UPDATE) para checar estoque com segurança
    // mesmo sob pedidos concorrentes, e calcula o valor pelo preço vigente no catálogo
    let valorTotal = 0;
    const itensParaGravar = [];
    for (const item of itens) {
      const [produtos] = await conexao.query(
        'SELECT id_produto, nome_produto, preco_venda, estoque_disponivel, ativo FROM produto WHERE id_produto = ? FOR UPDATE',
        [item.id_produto]
      );
      if (!produtos.length) throw new ApiError(404, `Produto ${item.id_produto} não encontrado.`);
      const produto = produtos[0];
      if (!produto.ativo) throw new ApiError(400, `Produto "${produto.nome_produto}" não está mais à venda.`);
      if (produto.estoque_disponivel < item.quantidade) {
        throw new ApiError(409, `Estoque insuficiente para "${produto.nome_produto}": disponível ${produto.estoque_disponivel}, solicitado ${item.quantidade}.`);
      }
      const valorUnitario = Number(produto.preco_venda);
      valorTotal += valorUnitario * item.quantidade;
      itensParaGravar.push({ id_produto: produto.id_produto, quantidade: item.quantidade, valor_unitario: valorUnitario });
    }

    const [resultadoPedido] = await conexao.query(
      `INSERT INTO pedido (id_usuario, id_endereco, valor_total, status, forma_pagamento)
       VALUES (?, ?, ?, 'Pendente', ?)`,
      [id_usuario, id_endereco, valorTotal.toFixed(2), forma_pagamento]
    );
    const id_pedido = resultadoPedido.insertId;

    for (const item of itensParaGravar) {
      await conexao.query(
        'INSERT INTO item_pedido (id_pedido, id_produto, quantidade, valor_unitario) VALUES (?, ?, ?, ?)',
        [id_pedido, item.id_produto, item.quantidade, item.valor_unitario]
      );
      // baixa automática de estoque no momento da confirmação do pedido
      await conexao.query(
        'UPDATE produto SET estoque_disponivel = estoque_disponivel - ? WHERE id_produto = ?',
        [item.quantidade, item.id_produto]
      );
    }

    await conexao.commit();
    res.status(201).json({
      id_pedido,
      status: 'Pendente',
      valor_total: Number(valorTotal.toFixed(2)),
      itens: itensParaGravar,
    });
  } catch (err) {
    await conexao.rollback();
    next(err);
  } finally {
    conexao.release();
  }
});

// PATCH /api/pedidos/:id/status  { status: 'Pago' | 'Enviado' | 'Entregue' | 'Cancelado' }
// Cancelar um pedido Pendente ou Pago devolve os itens ao estoque.
router.patch('/:id/status', async (req, res, next) => {
  const { status } = req.body;
  if (!STATUS_VALIDOS.includes(status)) {
    return next(new ApiError(400, `status deve ser um de: ${STATUS_VALIDOS.join(', ')}.`));
  }
  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();
    const [pedidos] = await conexao.query('SELECT * FROM pedido WHERE id_pedido = ? FOR UPDATE', [req.params.id]);
    if (!pedidos.length) throw new ApiError(404, 'Pedido não encontrado.');
    const pedido = pedidos[0];

    if (status === 'Cancelado' && pedido.status !== 'Cancelado') {
      const [itens] = await conexao.query('SELECT id_produto, quantidade FROM item_pedido WHERE id_pedido = ?', [pedido.id_pedido]);
      for (const item of itens) {
        await conexao.query(
          'UPDATE produto SET estoque_disponivel = estoque_disponivel + ? WHERE id_produto = ?',
          [item.quantidade, item.id_produto]
        );
      }
    }

    await conexao.query('UPDATE pedido SET status = ? WHERE id_pedido = ?', [status, pedido.id_pedido]);
    await conexao.commit();
    res.json({ id_pedido: pedido.id_pedido, status });
  } catch (err) {
    await conexao.rollback();
    next(err);
  } finally {
    conexao.release();
  }
});

module.exports = router;
