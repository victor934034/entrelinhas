/* Redefine a senha de uma conta direto no banco: node reset-senha.js email@exemplo.com NovaSenha123 */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const [email, senha] = process.argv.slice(2);
if (!email || !senha || senha.length < 8) { console.log('Uso: node reset-senha.js <email> <nova senha com 8+ caracteres>\nPare o servidor antes de rodar.'); process.exit(1); }
const dir = process.env.ER_DATA ? path.resolve(process.env.ER_DATA) : path.join(__dirname, 'data');
const file = path.join(dir, 'db.json');
const db = JSON.parse(fs.readFileSync(file, 'utf8'));
const u = db.users.find(x => x.email === email.toLowerCase());
if (!u) { console.log('Conta não encontrada: ' + email + '\nContas existentes: ' + db.users.map(x => x.email).join(', ')); process.exit(1); }
u.salt = crypto.randomBytes(16).toString('hex');
u.hash = crypto.scryptSync(senha, u.salt, 64).toString('hex');
Object.keys(db.sessions).forEach(k => { if (db.sessions[k].uid === u.id) delete db.sessions[k]; });
fs.writeFileSync(file + '.tmp', JSON.stringify(db)); fs.renameSync(file + '.tmp', file);
console.log('Senha de ' + u.email + ' redefinida. Reinicie o servidor.');
