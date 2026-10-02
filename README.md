# entre linhas — E-commerce de livros e infoprodutos digitais

Projeto Integrador — 3º Ano do Ensino Técnico. Marketplace onde autores
independentes publicam e vendem livros e infoprodutos digitais (PDF, EPUB,
XLSX, cursos em vídeo etc.).

## Estrutura do repositório

```
entrelinhasfront/     front-end estático (protótipo de telas em HTML/CSS/JS)
banco-de-dados/       modelagem (DER) e script SQL (DDL + DML) do banco relacional
backend/              API REST em Node.js + Express + MySQL
```

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- MySQL 8 ou MariaDB 10.4+ (neste projeto foi usado o MariaDB do XAMPP)

## 1. Configurar o banco de dados

1. Inicie o MySQL/MariaDB (no XAMPP: Painel de Controle → Start no módulo MySQL).
2. Rode o script de criação e carga de testes:

   ```bash
   mysql -h 127.0.0.1 -u root -p < banco-de-dados/entrelinhas.sql
   ```

   O script cria o banco `entrelinhas`, as 7 tabelas, as restrições de
   integridade (PK, FK, CHECK, UNIQUE, DEFAULT) e uma carga de dados de
   teste (categorias, produtos, usuários, endereços e pedidos de exemplo).
   Pode ser executado também pelo phpMyAdmin, importando o arquivo.

A documentação completa da modelagem (DER conceitual, DER lógico e
dicionário de dados) está em `banco-de-dados/documentacao.pdf`.

## 2. Configurar e rodar o back-end

```bash
cd backend
npm install
copy .env.example .env    # no Linux/Mac: cp .env.example .env
```

Abra o `.env` e ajuste usuário/senha do banco se necessário (por padrão:
`root` sem senha, banco `entrelinhas`, porta `3306`).

```bash
npm start
```

A API sobe em `http://localhost:3000`. Para checar se está no ar:

```bash
curl http://localhost:3000/api/saude
```

Para desenvolvimento com recarregamento automático: `npm run dev`.

## 3. Variáveis de ambiente (`backend/.env`)

| Variável      | Descrição                              | Padrão      |
|---------------|-----------------------------------------|-------------|
| `DB_HOST`     | Host do MySQL/MariaDB                   | `127.0.0.1` |
| `DB_PORT`     | Porta do banco                          | `3306`      |
| `DB_USER`     | Usuário do banco                        | `root`      |
| `DB_PASSWORD` | Senha do banco                          | (vazio)     |
| `DB_NAME`     | Nome do banco                           | `entrelinhas` |
| `PORT`        | Porta em que a API vai rodar            | `3000`      |

## 4. Rotas da API

Todas as respostas são JSON. Erros de validação voltam com status `400`,
conflitos (duplicidade, estoque insuficiente) com `409`, e recursos
inexistentes com `404`, sempre no formato `{ "erro": "mensagem" }`.

### Categorias
| Método | Rota                  | Descrição                                   |
|--------|------------------------|----------------------------------------------|
| GET    | `/api/categorias`      | Lista categorias (filtro opcional `?ativo=`) |
| GET    | `/api/categorias/:id`  | Detalhe de uma categoria                      |
| POST   | `/api/categorias`      | Cria categoria                                |
| PUT    | `/api/categorias/:id`  | Atualiza categoria                            |
| DELETE | `/api/categorias/:id`  | Inativa a categoria (`ativo = 0`)             |

### Produtos
| Método | Rota                 | Descrição                                                        |
|--------|-----------------------|-------------------------------------------------------------------|
| GET    | `/api/produtos`       | Lista produtos (filtros `?categoria=`, `?ativo=`, `?busca=`)       |
| GET    | `/api/produtos/:id`   | Detalhe do produto, com seus arquivos                             |
| POST   | `/api/produtos`       | Cria produto (valida preço > 0, estoque ≥ 0, categoria/autor existentes) |
| PUT    | `/api/produtos/:id`   | Atualiza produto                                                   |
| DELETE | `/api/produtos/:id`   | Inativa o produto (`ativo = 0`)                                    |

### Usuários
| Método | Rota                             | Descrição                                            |
|--------|-----------------------------------|--------------------------------------------------------|
| GET    | `/api/usuarios`                   | Lista usuários (filtros `?perfil=`, `?ativo=`), sem a senha |
| GET    | `/api/usuarios/:id`                | Detalhe do usuário                                     |
| POST   | `/api/usuarios`                    | Cadastra usuário (valida e-mail, CPF/CNPJ e duplicidade; senha é armazenada como hash bcrypt) |
| PUT    | `/api/usuarios/:id`                | Atualiza usuário                                       |
| DELETE | `/api/usuarios/:id`                | Inativa o usuário (`ativo = 0`)                        |
| GET    | `/api/usuarios/:id/enderecos`      | Lista endereços do usuário                             |
| POST   | `/api/usuarios/:id/enderecos`      | Cadastra endereço para o usuário                       |

### Pedidos (checkout)
| Método | Rota                        | Descrição                                   |
|--------|------------------------------|-----------------------------------------------|
| GET    | `/api/pedidos`               | Lista pedidos (filtros `?usuario=`, `?status=`) |
| GET    | `/api/pedidos/:id`           | Detalhe do pedido, com itens                   |
| POST   | `/api/pedidos`               | Finaliza um pedido (checkout)                  |
| PATCH  | `/api/pedidos/:id/status`    | Atualiza o status do pedido                    |

**Exemplo de checkout** — `POST /api/pedidos`:

```json
{
  "id_usuario": 2,
  "id_endereco": 1,
  "forma_pagamento": "pix",
  "itens": [
    { "id_produto": 1, "quantidade": 1 },
    { "id_produto": 6, "quantidade": 2 }
  ]
}
```

O back-end, dentro de uma única transação:
1. confirma que o usuário existe e está ativo;
2. confirma que o endereço pertence a esse usuário;
3. trava e confere o estoque de cada produto (`SELECT ... FOR UPDATE`),
   recusando o pedido com `409` se a quantidade pedida for maior que o
   estoque disponível;
4. grava o cabeçalho do pedido com status `Pendente` e o valor total
   calculado pelo preço vigente no catálogo;
5. grava cada item em `item_pedido`;
6. dá baixa automática no estoque de cada produto.

Se qualquer passo falhar, a transação é desfeita (`ROLLBACK`) e nada é
gravado. Cancelar um pedido (`PATCH .../status` com `"status": "Cancelado"`)
devolve as quantidades ao estoque.

## 5. Testando rapidamente

```bash
curl http://localhost:3000/api/produtos
curl -X POST http://localhost:3000/api/categorias -H "Content-Type: application/json" -d "{\"nome_categoria\":\"Podcasts\"}"
```

## Decisões de projeto

- Exclusões de produto, categoria e usuário são feitas por **inativação**
  (`ativo = 0`), não por `DELETE` físico — preserva o histórico de pedidos
  já realizados, que referenciam esses registros por chave estrangeira.
- O preço gravado em cada item do pedido é o preço do produto **no momento
  da compra**; alterar o preço do catálogo depois não muda pedidos antigos.
- Senhas nunca são armazenadas em texto puro (hash bcrypt via `bcryptjs`).
