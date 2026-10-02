const express = require('express');
const cors = require('cors');
const { ApiError } = require('./middleware/validate');

const categoriasRouter = require('./routes/categorias');
const produtosRouter = require('./routes/produtos');
const usuariosRouter = require('./routes/usuarios');
const pedidosRouter = require('./routes/pedidos');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/saude', (req, res) => res.json({ status: 'ok' }));

app.use('/api/categorias', categoriasRouter);
app.use('/api/produtos', produtosRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/pedidos', pedidosRouter);

// rota inexistente
app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// handler central de erros: ApiError vira o status/mensagem esperados,
// erros do MySQL (FK, UNIQUE etc.) viram 409/400 em vez de 500 genérico
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ erro: err.message });
  }
  if (err && err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ erro: 'Registro duplicado (valor já cadastrado em um campo único).' });
  }
  if (err && (err.code === 'ER_NO_REFERENCED_ROW' || err.code === 'ER_NO_REFERENCED_ROW_2')) {
    return res.status(400).json({ erro: 'Referência inválida: um dos IDs informados não existe.' });
  }
  if (err && err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ erro: 'Não é possível excluir: existem registros vinculados a este item.' });
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

module.exports = app;
