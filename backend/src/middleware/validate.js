// Funções pequenas de validação, reaproveitadas pelas rotas de categoria, produto,
// usuário e pedido. Todas lançam ApiError, capturado pelo handler central em app.js.

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function obrigatorio(valor, campo) {
  if (valor === undefined || valor === null || String(valor).trim() === '') {
    throw new ApiError(400, `O campo "${campo}" é obrigatório.`);
  }
}

function emailValido(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(String(email || ''))) {
    throw new ApiError(400, 'E-mail inválido.');
  }
}

function cpfCnpjValido(valor) {
  const digitos = String(valor || '').replace(/\D/g, '');
  if (digitos.length !== 11 && digitos.length !== 14) {
    throw new ApiError(400, 'CPF/CNPJ inválido: use 11 dígitos (CPF) ou 14 (CNPJ).');
  }
  return digitos;
}

function precoValido(preco) {
  const n = Number(preco);
  if (!Number.isFinite(n) || n <= 0) {
    throw new ApiError(400, 'O preço de venda deve ser um número maior que zero.');
  }
  return n;
}

function estoqueValido(estoque) {
  const n = Number(estoque);
  if (!Number.isInteger(n) || n < 0) {
    throw new ApiError(400, 'O estoque deve ser um número inteiro maior ou igual a zero.');
  }
  return n;
}

function inteiroPositivo(valor, campo) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ApiError(400, `O campo "${campo}" deve ser um número inteiro maior que zero.`);
  }
  return n;
}

module.exports = {
  ApiError,
  obrigatorio,
  emailValido,
  cpfCnpjValido,
  precoValido,
  estoqueValido,
  inteiroPositivo,
};
