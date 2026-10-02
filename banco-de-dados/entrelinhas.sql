-- =====================================================================
-- Projeto Integrador - E-commerce "entre linhas"
-- Marketplace de livros e infoprodutos digitais (autores independentes)
-- Script completo: DDL (criação) + DML (carga de testes)
-- Compatível com MySQL 8.0.16+ e MariaDB 10.4+ (CHECK só é validado a partir dessas versões)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. DDL - BANCO E TABELAS
-- ---------------------------------------------------------------------
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS entrelinhas
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE entrelinhas;

-- Usuários: clientes, autores (quem publica na loja) e administradores
CREATE TABLE usuario (
    id_usuario      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    nome            VARCHAR(120)  NOT NULL,
    email           VARCHAR(150)  NOT NULL,
    senha_hash      VARCHAR(255)  NOT NULL,
    cpf_cnpj        VARCHAR(18)   NOT NULL,
    telefone        VARCHAR(20)   NULL,
    perfil          ENUM('cliente','autor','administrador') NOT NULL DEFAULT 'cliente',
    ativo           BOOLEAN       NOT NULL DEFAULT TRUE,
    data_cadastro   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_usuario          PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuario_email    UNIQUE (email),
    CONSTRAINT uq_usuario_cpf_cnpj UNIQUE (cpf_cnpj)
) ENGINE=InnoDB;

-- Endereços: um usuário pode ter vários (entrega e faturamento)
CREATE TABLE endereco (
    id_endereco     INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    id_usuario      INT UNSIGNED  NOT NULL,
    apelido         VARCHAR(40)   NOT NULL DEFAULT 'Principal',
    rua             VARCHAR(150)  NOT NULL,
    numero          VARCHAR(10)   NOT NULL,
    complemento     VARCHAR(60)   NULL,
    bairro          VARCHAR(80)   NOT NULL,
    cep             CHAR(8)       NOT NULL,
    cidade          VARCHAR(80)   NOT NULL,
    estado          CHAR(2)       NOT NULL,
    tipo            ENUM('entrega','faturamento','ambos') NOT NULL DEFAULT 'ambos',
    CONSTRAINT pk_endereco         PRIMARY KEY (id_endereco),
    -- permite que o pedido referencie (endereco, dono) e garanta que o endereço é do comprador
    CONSTRAINT uq_endereco_usuario UNIQUE (id_endereco, id_usuario),
    CONSTRAINT fk_endereco_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT ck_endereco_cep     CHECK (cep REGEXP '^[0-9]{8}$')
) ENGINE=InnoDB;

CREATE TABLE categoria (
    id_categoria    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    nome_categoria  VARCHAR(60)   NOT NULL,
    slug            VARCHAR(60)   NOT NULL,
    descricao       VARCHAR(255)  NULL,
    ativo           BOOLEAN       NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_categoria      PRIMARY KEY (id_categoria),
    CONSTRAINT uq_categoria_nome UNIQUE (nome_categoria),
    CONSTRAINT uq_categoria_slug UNIQUE (slug)
) ENGINE=InnoDB;

CREATE TABLE produto (
    id_produto          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    id_categoria        INT UNSIGNED  NOT NULL,
    id_autor            INT UNSIGNED  NOT NULL,
    slug                VARCHAR(100)  NOT NULL,
    nome_produto        VARCHAR(100)  NOT NULL,
    subtitulo           VARCHAR(160)  NULL,
    descricao           TEXT          NOT NULL,
    preco_venda         DECIMAL(10,2) NOT NULL,
    estoque_disponivel  INT           NOT NULL DEFAULT 0,
    imagem_url          VARCHAR(255)  NOT NULL,
    ativo               BOOLEAN       NOT NULL DEFAULT TRUE,
    data_cadastro       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_produto           PRIMARY KEY (id_produto),
    CONSTRAINT uq_produto_slug      UNIQUE (slug),
    CONSTRAINT fk_produto_categoria FOREIGN KEY (id_categoria) REFERENCES categoria (id_categoria)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_produto_autor     FOREIGN KEY (id_autor) REFERENCES usuario (id_usuario)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_produto_preco     CHECK (preco_venda > 0),
    CONSTRAINT ck_produto_estoque   CHECK (estoque_disponivel >= 0)
) ENGINE=InnoDB;

CREATE INDEX idx_produto_categoria ON produto (id_categoria);
CREATE INDEX idx_produto_autor     ON produto (id_autor);

-- Arquivos entregues ao comprador (PDF, EPUB, XLSX...). Um produto tem varios formatos.
CREATE TABLE produto_arquivo (
    id_arquivo       INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    id_produto       INT UNSIGNED  NOT NULL,
    formato          VARCHAR(10)   NOT NULL,
    tamanho_kb       INT UNSIGNED  NOT NULL,
    caminho_arquivo  VARCHAR(255)  NOT NULL,
    CONSTRAINT pk_produto_arquivo         PRIMARY KEY (id_arquivo),
    CONSTRAINT uq_produto_arquivo_formato UNIQUE (id_produto, formato),
    CONSTRAINT fk_arquivo_produto         FOREIGN KEY (id_produto) REFERENCES produto (id_produto)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT ck_arquivo_tamanho         CHECK (tamanho_kb > 0)
) ENGINE=InnoDB;

CREATE TABLE pedido (
    id_pedido        INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    id_usuario       INT UNSIGNED  NOT NULL,
    id_endereco      INT UNSIGNED  NOT NULL,
    data_pedido      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valor_total      DECIMAL(10,2) NOT NULL,
    status           ENUM('Pendente','Pago','Enviado','Entregue','Cancelado') NOT NULL DEFAULT 'Pendente',
    forma_pagamento  ENUM('pix','cartao','boleto') NOT NULL,
    CONSTRAINT pk_pedido          PRIMARY KEY (id_pedido),
    CONSTRAINT fk_pedido_usuario  FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    -- FK composta: o endereço escolhido precisa pertencer ao mesmo usuário do pedido
    CONSTRAINT fk_pedido_endereco FOREIGN KEY (id_endereco, id_usuario) REFERENCES endereco (id_endereco, id_usuario)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_pedido_total    CHECK (valor_total >= 0)
) ENGINE=InnoDB;

CREATE INDEX idx_pedido_usuario ON pedido (id_usuario);
CREATE INDEX idx_pedido_status  ON pedido (status);

CREATE TABLE item_pedido (
    id_item         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    id_pedido       INT UNSIGNED  NOT NULL,
    id_produto      INT UNSIGNED  NOT NULL,
    quantidade      INT UNSIGNED  NOT NULL DEFAULT 1,
    valor_unitario  DECIMAL(10,2) NOT NULL,
    CONSTRAINT pk_item_pedido         PRIMARY KEY (id_item),
    CONSTRAINT uq_item_pedido_produto UNIQUE (id_pedido, id_produto),
    CONSTRAINT fk_item_pedido         FOREIGN KEY (id_pedido) REFERENCES pedido (id_pedido)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_item_produto        FOREIGN KEY (id_produto) REFERENCES produto (id_produto)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_item_quantidade     CHECK (quantidade > 0),
    CONSTRAINT ck_item_valor          CHECK (valor_unitario > 0)
) ENGINE=InnoDB;

CREATE INDEX idx_item_produto ON item_pedido (id_produto);

-- ---------------------------------------------------------------------
-- 2. DML - CARGA DE TESTES
-- Senhas: os valores de senha_hash são hashes bcrypt de exemplo (a senha real
-- nunca é gravada em texto puro; a aplicação deve gerar o hash no cadastro).
-- ---------------------------------------------------------------------

-- Usuários: 1 administrador, 2 clientes e 8 autores (um por livro cadastrado)
INSERT INTO usuario (nome, email, senha_hash, cpf_cnpj, telefone, perfil) VALUES
('Administrador entre linhas', 'admin@entrelinhas.com.br',  '$2b$10$nRwEHKsFZCJ1zGcJ0FNaFwEaDPjzQNlVLWtKGFY90m54skdVdIk9p', '11144477735',     '81999990000', 'administrador'),
('Marcelo Tavares',            'marcelo.tavares@email.com', '$2b$10$3iHNzTpR8zDHmpq94GJg6GFl3ivqA5rTM9FZiOdww9IT3xhP1hzru', '52998224725',     '41988887777', 'cliente'),
('Josiane Prado',              'josiane.prado@email.com',   '$2b$10$bRIURbb/8Vfi.QztmOE4wwxwL7xFWGY2SMpEL.RKsBHYuReqs6NM8', '39053344705',     '71977776666', 'cliente'),
('Helena Arruda Moura',        'helena.moura@email.com.br', '$2b$10$577lIQLpf7SAYsQBkJfsTraoaWcxbX9rBBh6fWq3qsIaLb6XpY7.7', '86288366757',     '31966665555', 'autor'),
('Rafael Tenório',             'rafael.tenorio@email.com',  '$2b$10$qINvX7U1oJw5xISTOBR5Q6qROA/LP1WZBeZjcnfzOFr4zORA2V.RU', '71428793860',     '81955554444', 'autor'),
('Iara Quintela',              'iara.quintela@email.com',   '$2b$10$Q6NFn7LFdWhDK3BG2nXh37dfX3PzNw2mHc0HZkNRsQeP5aKw8SaS1', '12345678909',     '81944443333', 'autor'),
('Aparecida Lopes',            'cidinha.lopes@email.com',   '$2b$10$xpzXrmJsAp42AvojGMbLIfgDVgO0fxR9nJhFV0HgAJfIaGfN4/pzg', '98765432100',     '11933332222', 'autor'),
('Túlio Baracho',              'tulio.baracho@email.com',   '$2b$10$ODcMSfEVXllYj3UgqAeC/AW6d3L19wlZbpXPxqEO/He1SFIuidjD4', '45317828791',     '62922221111', 'autor'),
('Marina Sabóia',              'marina.saboia@email.com',   '$2b$10$VSg3.fsondClZrV.ouI6hXd.JfJQxDwAkkbIRvn9RiQD0PAbIBDPs', '01234567890',     '85911110000', 'autor'),
('Cauê Prado',                 'caue.prado@email.com',      '$2b$10$Lu3EAd8f.4GJG6eHfcYb49uH7iDXHQoekP/7F8gKZ8ji555NXlI6A', '10293847560',     '51900009999', 'autor'),
('Nádia Ferrão',               'nadia.ferrao@email.com',    '$2b$10$j4H3gvYYHJQfsOhMsb98wBS.83xkQzqumNo.npwNX/jetGwvHs0hE', '33344455566',     '21988880000', 'autor');

INSERT INTO endereco (id_usuario, apelido, rua, numero, complemento, bairro, cep, cidade, estado, tipo) VALUES
(2, 'Casa',     'Rua XV de Novembro',    '1200', 'Apto 42', 'Centro',     '80020310', 'Curitiba', 'PR', 'ambos'),
(2, 'Trabalho', 'Avenida Sete de Setembro', '350', NULL,    'Batel',      '80250000', 'Curitiba', 'PR', 'faturamento'),
(3, 'Casa',     'Rua da Paz',            '87',   'Casa B',  'Pituba',     '41830000', 'Salvador', 'BA', 'ambos');

INSERT INTO categoria (nome_categoria, slug, descricao) VALUES
('Ficção',            'ficcao',     'Contos e romances de autores independentes.'),
('Crônicas e poesia', 'cronicas',   'Crônicas, poemas e textos curtos.'),
('Finanças pessoais', 'financas',   'Orçamento, planilhas e educação financeira.'),
('Arte e imagem',     'arte',       'Ilustração, desenho e fotografia.'),
('Culinária',         'culinaria',  'Receitas e técnicas de cozinha.'),
('Tecnologia',        'tecnologia', 'Programação e automação para o dia a dia.'),
('Para quem escreve', 'autores',    'Guias para publicar e vender o próprio livro.');

INSERT INTO produto (id_categoria, id_autor, slug, nome_produto, subtitulo, descricao, preco_venda, estoque_disponivel, imagem_url) VALUES
(1, 4,  'o-peso-das-manhas-curtas',            'O Peso das Manhãs Curtas',
    'Onze contos sobre quem acorda antes do resto da casa.',
    'Onze histórias curtas sobre padeiras, vigias noturnos e pais que descobrem o sol tarde. Editado por conta própria e revisado três vezes.',
    24.90, 999, 'img/capas/o-peso-das-manhas-curtas.jpg'),
(3, 5,  'planilhas-que-sobrevivem-a-marco',    'Planilhas que Sobrevivem a Março',
    'Um método de orçamento para quem já abandonou três apps de finanças.',
    'Guia de 132 páginas mais planilha XLSX com fórmulas para renda variável, parcelamentos e reserva de emergência.',
    39.00, 999, 'img/capas/planilhas-que-sobrevivem-a-marco.jpg'),
(4, 6,  'caderno-de-bordas',                   'Caderno de Bordas',
    'Ilustração com nanquim, do primeiro traço a última mancha.',
    'Sessenta exercícios de nanquim com espaço para desenhar por cima. PDF em alta resolução para impressão A4 e tablet.',
    49.90, 500, 'img/capas/caderno-de-bordas.jpg'),
(5, 7,  'vinte-e-tres-receitas-de-domingo',    'Vinte e Três Receitas de Domingo',
    'Comida de panela grande, escrita por quem cozinhou para doze pessoas por trinta anos.',
    'Receitas de família, com quantidades para muita gente e dicas de quem cozinhou por trinta anos.',
    19.90, 999, 'img/capas/vinte-e-tres-receitas-de-domingo.jpg'),
(2, 8,  'sem-filtro-de-cidade-pequena',        'Sem Filtro de Cidade Pequena',
    'Trinta e duas crônicas sobre voltar para onde todo mundo sabe seu nome.',
    'Crônicas sobre voltar para a cidade natal e reaprender o ritmo de um lugar onde todo mundo se conhece.',
    14.90, 999, 'img/capas/sem-filtro-de-cidade-pequena.jpg'),
(6, 9,  'python-para-noites-livres',           'Python para Quem Só Tem Noites Livres',
    'Trinta noites de uma hora para automatizar seu próprio trabalho.',
    'Curso em texto de 30 noites, com exercícios práticos para automatizar planilhas, e-mails e arquivos.',
    59.00, 999, 'img/capas/python-para-noites-livres.jpg'),
(7, 10, 'guia-do-primeiro-livro-independente', 'Guia do Primeiro Livro Independente',
    'Do arquivo do Word ao primeiro pagamento na conta, sem editora.',
    'Passo a passo para revisar, diagramar, publicar e vender um livro digital sem depender de editora.',
    34.90, 999, 'img/capas/guia-do-primeiro-livro-independente.jpg'),
(2, 11, 'mapas-de-uma-casa-vazia',             'Mapas de Uma Casa Vazia',
    'Poemas escritos depois da mudança, cômodo por cômodo.',
    'Livro de poemas organizado por cômodos de uma casa depois da mudança.',
    12.00, 999, 'img/capas/mapas-de-uma-casa-vazia.jpg');

INSERT INTO produto_arquivo (id_produto, formato, tamanho_kb, caminho_arquivo) VALUES
(1, 'EPUB', 1434, 'arquivos/o-peso-das-manhas-curtas.epub'),
(1, 'PDF',  2150, 'arquivos/o-peso-das-manhas-curtas.pdf'),
(2, 'PDF',  3890, 'arquivos/planilhas-que-sobrevivem-a-marco.pdf'),
(2, 'XLSX',  640, 'arquivos/planilhas-que-sobrevivem-a-marco.xlsx'),
(3, 'PDF', 49152, 'arquivos/caderno-de-bordas.pdf'),
(4, 'PDF',  9216, 'arquivos/vinte-e-tres-receitas-de-domingo.pdf'),
(4, 'EPUB', 5120, 'arquivos/vinte-e-tres-receitas-de-domingo.epub'),
(5, 'EPUB',  900, 'arquivos/sem-filtro-de-cidade-pequena.epub'),
(5, 'PDF',  1638, 'arquivos/sem-filtro-de-cidade-pequena.pdf'),
(6, 'PDF',  6144, 'arquivos/python-para-noites-livres.pdf'),
(6, 'ZIP',  2253, 'arquivos/python-para-noites-livres.zip'),
(7, 'PDF',  4506, 'arquivos/guia-do-primeiro-livro-independente.pdf'),
(8, 'EPUB',  600, 'arquivos/mapas-de-uma-casa-vazia.epub'),
(8, 'PDF',  1126, 'arquivos/mapas-de-uma-casa-vazia.pdf');

-- Pedido 1: Marcelo, Pix, entregue. "Planilhas" foi comprada em promoção (34,90),
-- por isso valor_unitario difere do preço atual do catálogo.
INSERT INTO pedido (id_usuario, id_endereco, data_pedido, valor_total, status, forma_pagamento) VALUES
(2, 1, '2026-08-12 09:15:00', 59.80, 'Entregue', 'pix');
INSERT INTO item_pedido (id_pedido, id_produto, quantidade, valor_unitario) VALUES
(1, 1, 1, 24.90),
(1, 2, 1, 34.90);

-- Pedido 2: Marcelo, cartão, pago
INSERT INTO pedido (id_usuario, id_endereco, data_pedido, valor_total, status, forma_pagamento) VALUES
(2, 2, '2026-09-03 21:40:00', 59.00, 'Pago', 'cartao');
INSERT INTO item_pedido (id_pedido, id_produto, quantidade, valor_unitario) VALUES
(2, 6, 1, 59.00);

-- Pedido 3: Josiane, boleto, aguardando compensação (2 cópias de um livro + 1 livro de poemas)
INSERT INTO pedido (id_usuario, id_endereco, data_pedido, valor_total, status, forma_pagamento) VALUES
(3, 3, '2026-09-20 14:05:00', 51.80, 'Pendente', 'boleto');
INSERT INTO item_pedido (id_pedido, id_produto, quantidade, valor_unitario) VALUES
(3, 4, 2, 19.90),
(3, 8, 1, 12.00);

-- ---------------------------------------------------------------------
-- 3. CONSULTA DE CONFERÊNCIA (opcional): total do pedido = soma dos itens
-- ---------------------------------------------------------------------
-- SELECT p.id_pedido, p.valor_total, SUM(i.quantidade * i.valor_unitario) AS soma_itens
--   FROM pedido p JOIN item_pedido i ON i.id_pedido = p.id_pedido
--  GROUP BY p.id_pedido, p.valor_total;
