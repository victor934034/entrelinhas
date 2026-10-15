# entre linhas

Loja de livros e produtos digitais de autores independentes.

    iniciar.bat             # ou: node server.js  ->  http://localhost:3000
    (as páginas SÓ funcionam por esse endereço; abrir o .html direto ou por Live Server não tem banco nem login)
    npm test                # testes da API

- Sem dependências: só Node 18+.
- Dados em `data/` (db.json + arquivos enviados). Faça backup dessa pasta.
- `ER_DATA=/caminho` muda a pasta de dados.

## Como o pagamento funciona
O leitor paga por Pix **direto na chave do autor** (BR Code válido com valor exato).
O autor confirma o recebimento no painel e o arquivo é liberado.
Não há taxa nem saldo na plataforma, porque o dinheiro não passa por ela.
Para cobrar taxa, aceitar cartão/boleto ou confirmar Pix automaticamente é preciso
integrar um gateway (Mercado Pago, Asaas, Pagar.me...) em `POST /api/pedidos` e num webhook.

## Recuperação de senha
O botão "Esqueci a senha" envia um link (vale 1 hora) por e-mail. Para isso configure o SMTP
copiando `config.exemplo.json` para `config.json` (no Gmail use uma "senha de app").
Sem SMTP, o link é impresso no terminal do servidor. Alternativa direta:

    node reset-senha.js email@exemplo.com NovaSenha123     (com o servidor parado)
