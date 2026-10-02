// Pool de conexões MySQL compartilhado por toda a aplicação.
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'entrelinhas',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true, // DECIMAL vem como number, não como string
});

module.exports = pool;
