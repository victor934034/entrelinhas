# Gera documentacao.html (DER conceitual + logico + dicionario de dados) a partir das definicoes abaixo.
# O PDF e produzido a partir desse HTML com o Edge/Chrome em modo headless (ver README).
import html

# tabela -> (descricao, [(campo, tipo, chave, obrigatoriedade, descricao)])
T = {}

T['usuario'] = ('Pessoas que acessam a plataforma: clientes, autores (quem publica livros) e administradores.', [
    ('id_usuario', 'INT UNSIGNED', 'PK', 'NOT NULL', 'Identificador único auto-incrementável do usuário.'),
    ('nome', 'VARCHAR(120)', '-', 'NOT NULL', 'Nome completo ou razão social.'),
    ('email', 'VARCHAR(150)', '-', 'NOT NULL', 'E-mail de login. UNIQUE.'),
    ('senha_hash', 'VARCHAR(255)', '-', 'NOT NULL', 'Senha criptografada (hash bcrypt). Nunca em texto puro.'),
    ('cpf_cnpj', 'VARCHAR(18)', '-', 'NOT NULL', 'CPF ou CNPJ, só dígitos. UNIQUE.'),
    ('telefone', 'VARCHAR(20)', '-', 'NULL', 'Telefone com DDD.'),
    ('perfil', "ENUM('cliente','autor','administrador')", '-', 'NOT NULL', "Perfil de acesso (DEFAULT 'cliente')."),
    ('ativo', 'BOOLEAN', '-', 'NOT NULL', 'Conta ativa (DEFAULT TRUE). Permite desativar sem apagar histórico.'),
    ('data_cadastro', 'DATETIME', '-', 'NOT NULL', 'Data/hora do cadastro (DEFAULT CURRENT_TIMESTAMP).'),
])
T['endereco'] = ('Endereços de entrega e faturamento. Um usuário pode ter vários.', [
    ('id_endereco', 'INT UNSIGNED', 'PK', 'NOT NULL', 'Identificador único auto-incrementável do endereço.'),
    ('id_usuario', 'INT UNSIGNED', 'FK', 'NOT NULL', 'Dono do endereço. Referencia usuario (ON DELETE CASCADE).'),
    ('apelido', 'VARCHAR(40)', '-', 'NOT NULL', "Nome curto, ex.: Casa, Trabalho (DEFAULT 'Principal')."),
    ('rua', 'VARCHAR(150)', '-', 'NOT NULL', 'Logradouro.'),
    ('numero', 'VARCHAR(10)', '-', 'NOT NULL', 'Número (texto, aceita "s/n").'),
    ('complemento', 'VARCHAR(60)', '-', 'NULL', 'Apartamento, bloco, casa etc.'),
    ('bairro', 'VARCHAR(80)', '-', 'NOT NULL', 'Bairro.'),
    ('cep', 'CHAR(8)', '-', 'NOT NULL', 'CEP só com dígitos (CHECK: 8 dígitos).'),
    ('cidade', 'VARCHAR(80)', '-', 'NOT NULL', 'Cidade.'),
    ('estado', 'CHAR(2)', '-', 'NOT NULL', 'Sigla da UF.'),
    ('tipo', "ENUM('entrega','faturamento','ambos')", '-', 'NOT NULL', "Finalidade do endereço (DEFAULT 'ambos'). UNIQUE (id_endereco, id_usuario) para a FK composta do pedido."),
])
T['categoria'] = ('Agrupamento dos produtos da vitrine.', [
    ('id_categoria', 'INT UNSIGNED', 'PK', 'NOT NULL', 'Identificador único auto-incrementável da categoria.'),
    ('nome_categoria', 'VARCHAR(60)', '-', 'NOT NULL', 'Nome exibido no catálogo. UNIQUE.'),
    ('slug', 'VARCHAR(60)', '-', 'NOT NULL', 'Texto usado na URL do filtro. UNIQUE.'),
    ('descricao', 'VARCHAR(255)', '-', 'NULL', 'Descrição curta da categoria.'),
    ('ativo', 'BOOLEAN', '-', 'NOT NULL', 'Categoria visível no catálogo (DEFAULT TRUE). Inativar em vez de apagar preserva o histórico de produtos.'),
])
T['produto'] = ('Itens à venda: livros, guias, planilhas e cursos digitais.', [
    ('id_produto', 'INT UNSIGNED', 'PK', 'NOT NULL', 'Identificador único auto-incrementável do produto.'),
    ('id_categoria', 'INT UNSIGNED', 'FK', 'NOT NULL', 'Categoria do produto. Referencia categoria (ON DELETE RESTRICT).'),
    ('id_autor', 'INT UNSIGNED', 'FK', 'NOT NULL', "Autor que publicou. Referencia usuario (perfil 'autor')."),
    ('slug', 'VARCHAR(100)', '-', 'NOT NULL', 'Identificador legível usado na URL da página do produto. UNIQUE.'),
    ('nome_produto', 'VARCHAR(100)', '-', 'NOT NULL', 'Nome comercial exibido no catálogo.'),
    ('subtitulo', 'VARCHAR(160)', '-', 'NULL', 'Frase de apoio exibida abaixo do nome.'),
    ('descricao', 'TEXT', '-', 'NOT NULL', 'Descrição detalhada do produto.'),
    ('preco_venda', 'DECIMAL(10,2)', '-', 'NOT NULL', 'Valor de venda unitário atual (CHECK > 0).'),
    ('estoque_disponivel', 'INT', '-', 'NOT NULL', 'Quantidade disponível para venda online (DEFAULT 0; CHECK >= 0). Em produto digital funciona como limite de licenças/cópias.'),
    ('imagem_url', 'VARCHAR(255)', '-', 'NOT NULL', 'Caminho ou link da imagem de capa.'),
    ('ativo', 'BOOLEAN', '-', 'NOT NULL', 'Publicado na loja (DEFAULT TRUE).'),
    ('data_cadastro', 'DATETIME', '-', 'NOT NULL', 'Data/hora do cadastro (DEFAULT CURRENT_TIMESTAMP).'),
])
T['produto_arquivo'] = ('Arquivos entregues ao comprador. Um produto pode ter vários formatos (PDF, EPUB, XLSX...).', [
    ('id_arquivo', 'INT UNSIGNED', 'PK', 'NOT NULL', 'Identificador único auto-incrementável do arquivo.'),
    ('id_produto', 'INT UNSIGNED', 'FK', 'NOT NULL', 'Produto dono do arquivo (ON DELETE CASCADE). UNIQUE junto com formato.'),
    ('formato', 'VARCHAR(10)', '-', 'NOT NULL', 'Extensão/formato: PDF, EPUB, XLSX, ZIP, MP4.'),
    ('tamanho_kb', 'INT UNSIGNED', '-', 'NOT NULL', 'Tamanho em kilobytes (CHECK > 0).'),
    ('caminho_arquivo', 'VARCHAR(255)', '-', 'NOT NULL', 'Caminho do arquivo no armazenamento privado.'),
])
T['pedido'] = ('Cabeçalho da compra.', [
    ('id_pedido', 'INT UNSIGNED', 'PK', 'NOT NULL', 'Identificador único auto-incrementável do pedido.'),
    ('id_usuario', 'INT UNSIGNED', 'FK', 'NOT NULL', 'Comprador. Referencia usuario (ON DELETE RESTRICT).'),
    ('id_endereco', 'INT UNSIGNED', 'FK', 'NOT NULL', 'Endereço selecionado. FK composta (id_endereco, id_usuario) para endereco: só aceita endereço do próprio comprador.'),
    ('data_pedido', 'DATETIME', '-', 'NOT NULL', 'Data/hora da compra (DEFAULT CURRENT_TIMESTAMP).'),
    ('valor_total', 'DECIMAL(10,2)', '-', 'NOT NULL', 'Soma de quantidade x valor_unitario dos itens (CHECK >= 0).'),
    ('status', "ENUM('Pendente','Pago','Enviado','Entregue','Cancelado')", '-', 'NOT NULL', "Situação do pedido (DEFAULT 'Pendente')."),
    ('forma_pagamento', "ENUM('pix','cartao','boleto')", '-', 'NOT NULL', 'Forma de pagamento escolhida no checkout.'),
])
T['item_pedido'] = ('Tabela associativa entre pedido e produto (relação N:M).', [
    ('id_item', 'INT UNSIGNED', 'PK', 'NOT NULL', 'Identificador único auto-incrementável do item.'),
    ('id_pedido', 'INT UNSIGNED', 'FK', 'NOT NULL', 'Pedido do item (ON DELETE CASCADE). UNIQUE junto com id_produto.'),
    ('id_produto', 'INT UNSIGNED', 'FK', 'NOT NULL', 'Produto comprado (ON DELETE RESTRICT).'),
    ('quantidade', 'INT UNSIGNED', '-', 'NOT NULL', 'Quantidade adquirida (DEFAULT 1; CHECK > 0).'),
    ('valor_unitario', 'DECIMAL(10,2)', '-', 'NOT NULL', 'Preço praticado no momento da compra (CHECK > 0). Não muda se o preço do catálogo mudar depois.'),
])

esc = html.escape


def logical_box(name, x, y, w):
    _, cols = T[name]
    h = 26 + 17 * len(cols) + 6
    out = [f'<g><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" class="tb"/>',
           f'<rect x="{x}" y="{y}" width="{w}" height="24" rx="4" class="th"/>',
           f'<text x="{x + w/2}" y="{y + 16}" class="tt">{name}</text>']
    for i, c in enumerate(cols):
        cy = y + 26 + 17 * i + 13
        key = c[2]
        cls = 'pk' if key == 'PK' else 'fk' if key == 'FK' else 'cl'
        tag = key if key != '-' else ''
        out.append(f'<text x="{x + 8}" y="{cy}" class="{cls}">{c[0]}</text>')
        out.append(f'<text x="{x + w - 8}" y="{cy}" class="ty" text-anchor="end">{tag}</text>')
    out.append('</g>')
    return ''.join(out), h


def logical_svg():
    boxes = {'usuario': (30, 30, 240), 'endereco': (30, 310, 240), 'pedido': (350, 150, 240),
             'item_pedido': (350, 390, 240), 'produto': (670, 150, 270), 'categoria': (670, 10, 270),
             'produto_arquivo': (670, 450, 270)}
    parts, size = [], {}
    for n, (x, y, w) in boxes.items():
        s, h = logical_box(n, x, y, w)
        parts.append(s)
        size[n] = h

    def line(pts, a='1', b='N', la=None, lb=None):
        d = 'M' + ' L'.join(f'{px},{py}' for px, py in pts)
        r = f'<path d="{d}" class="ln"/>'
        (x1, y1), (x2, y2) = pts[0], pts[-1]
        r += f'<text x="{x1 + la[0]}" y="{y1 + la[1]}" class="card">{a}</text>'
        r += f'<text x="{x2 + lb[0]}" y="{y2 + lb[1]}" class="card">{b}</text>'
        return r

    rel = []
    rel.append(line([(150, 30 + size['usuario']), (150, 310)], '1', 'N', (8, 14), (8, -6)))                    # usuario 1:N endereco
    rel.append(line([(270, 190), (350, 190)], '1', 'N', (4, -6), (-12, -6)))                                     # usuario 1:N pedido
    rel.append(line([(270, 350), (350, 270)], '1', 'N', (4, -6), (-14, 14)))                                     # endereco 1:N pedido
    rel.append(line([(470, 150 + size['pedido']), (470, 390)], '1', 'N', (8, 14), (8, -6)))                      # pedido 1:N item
    rel.append(line([(590, 430), (670, 340)], 'N', '1', (-14, -6), (-14, 16)))                                   # item N:1 produto
    rel.append(line([(805, 10 + size['categoria']), (805, 150)], '1', 'N', (8, 14), (8, -6)))                    # categoria 1:N produto
    rel.append(line([(805, 150 + size['produto']), (805, 450)], '1', 'N', (8, 14), (8, -6)))                     # produto 1:N arquivo
    rel.append(line([(670, 185), (630, 185), (630, 125), (270, 125)], 'N', '1', (-14, -6), (4, -6)))             # produto N:1 usuario (autor)
    rel.append('<text x="450" y="118" class="note">id_autor (autor do produto)</text>')
    return ('<svg viewBox="0 0 970 640" xmlns="http://www.w3.org/2000/svg" class="der">'
            + ''.join(rel) + ''.join(parts) + '</svg>')


def ent(x, y, w, h, name, sub):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" class="en"/>'
            f'<text x="{x + w/2}" y="{y + 26}" class="et">{name}</text>'
            f'<text x="{x + w/2}" y="{y + 44}" class="es">{sub}</text>')


def dia(cx, cy, label):
    return (f'<polygon points="{cx},{cy-24} {cx+50},{cy} {cx},{cy+24} {cx-50},{cy}" class="dm"/>'
            f'<text x="{cx}" y="{cy+4}" class="dt">{label}</text>')


def conceptual_svg():
    p = []
    ln = lambda pts: p.append('<path d="M' + ' L'.join(f'{a},{b}' for a, b in pts) + '" class="ln"/>')
    tx = lambda x, y, t: p.append(f'<text x="{x}" y="{y}" class="card">{t}</text>')
    # linhas primeiro
    ln([(190, 190), (245, 190)]); ln([(345, 190), (400, 190)]); tx(200, 182, '1'); tx(382, 182, 'N')           # usuario realiza pedido
    ln([(540, 190), (560, 190)]); ln([(660, 190), (680, 190)]); tx(544, 182, 'N'); tx(664, 182, 'M')           # pedido contem produto
    ln([(470, 220), (470, 266)]); ln([(470, 314), (470, 330)]); tx(478, 236, 'N'); tx(478, 326, '1')           # pedido enviado para endereco
    ln([(115, 220), (115, 380), (190, 380)]); ln([(290, 380), (400, 380)]); tx(123, 236, '1'); tx(382, 372, 'N')  # usuario possui endereco
    ln([(115, 160), (115, 60), (410, 60)]); ln([(510, 60), (750, 60), (750, 160)]); tx(123, 150, '1'); tx(758, 150, 'N')  # usuario publica produto
    ln([(750, 220), (750, 266)]); ln([(750, 314), (750, 340)]); tx(758, 236, 'N'); tx(758, 334, '1')          # produto classificado categoria
    ln([(820, 190), (900, 190), (900, 434)]); ln([(900, 486), (900, 500), (820, 500)]); tx(830, 182, '1'); tx(832, 492, 'N')  # produto possui arquivo
    p.append(ent(40, 160, 150, 60, 'USUÁRIO', 'cliente | autor | admin'))
    p.append(ent(400, 160, 140, 60, 'PEDIDO', 'data, status, total'))
    p.append(ent(680, 160, 140, 60, 'PRODUTO', 'nome, preço, estoque'))
    p.append(ent(400, 330, 140, 60, 'ENDEREÇO', 'rua, CEP, cidade'))
    p.append(ent(680, 340, 140, 60, 'CATEGORIA', 'nome, slug'))
    p.append(ent(680, 470, 140, 60, 'ARQUIVO', 'formato, tamanho'))
    p.append(dia(295, 190, 'realiza'))
    p.append(dia(610, 190, 'contém'))
    p.append(dia(470, 290, 'enviado para'))
    p.append(dia(240, 380, 'possui'))
    p.append(dia(460, 60, 'publica'))
    p.append(dia(750, 290, 'classificado em'))
    p.append(dia(900, 460, 'possui'))
    p.append('<text x="610" y="236" class="note" text-anchor="middle">N:M resolvida pela tabela</text>'
             '<text x="610" y="250" class="note" text-anchor="middle">ITEM_PEDIDO (quantidade,</text>'
             '<text x="610" y="264" class="note" text-anchor="middle">valor unitário)</text>')
    return '<svg viewBox="0 0 970 560" xmlns="http://www.w3.org/2000/svg" class="der">' + ''.join(p) + '</svg>'


def dict_table(name):
    desc, cols = T[name]
    rows = ''.join(
        f'<tr><td class="mono">{esc(c[0])}</td><td class="mono">{esc(c[1])}</td><td>{esc(c[2])}</td><td>{esc(c[3])}</td><td>{esc(c[4])}</td></tr>'
        for c in cols)
    return (f'<section class="tabela"><h3>{name}</h3><p class="d">{esc(desc)}</p>'
            '<table><thead><tr><th>Campo (Atributo)</th><th>Tipo de Dado</th><th>Chave</th><th>Obrigatoriedade</th>'
            f'<th>Descrição / Restrição</th></tr></thead><tbody>{rows}</tbody></table></section>')


CSS = '''
@page { size: A4; margin: 16mm 14mm; }
* { box-sizing: border-box; }
body { font: 10.5pt/1.45 "Segoe UI", Arial, sans-serif; color: #221D17; margin: 0; }
h1 { font: 700 26pt Georgia, serif; color: #14344B; margin: 0 0 4px; }
h2 { font: 700 15pt Georgia, serif; color: #14344B; border-bottom: 2px solid #B5652E; padding-bottom: 4px; margin: 0 0 12px; }
h3 { font: 700 12pt "Segoe UI", sans-serif; color: #14344B; margin: 18px 0 2px; font-family: Consolas, monospace; }
.capa { padding-top: 70mm; }
.capa .sub { font-size: 13pt; color: #5B5347; margin-bottom: 30px; }
.capa dl { display: grid; grid-template-columns: 34mm 1fr; gap: 6px 10px; max-width: 150mm; }
.capa dt { color: #5B5347; } .capa dd { margin: 0; border-bottom: 1px solid #ccc; min-height: 1.3em; }
.pg { break-before: page; }
p { margin: 0 0 8px; } .d { color: #5B5347; margin: 0 0 6px; font-size: 9.5pt; }
table { border-collapse: collapse; width: 100%; font-size: 8.8pt; }
th { background: #14344B; color: #fff; text-align: left; padding: 4px 6px; }
td { border: 1px solid #d8d0c0; padding: 3px 6px; vertical-align: top; }
tbody tr:nth-child(even) td { background: #faf5ec; }
.mono { font-family: Consolas, monospace; font-size: 8.4pt; }
.tabela { break-inside: avoid; }
.der { width: 100%; height: auto; display: block; }
.tb { fill: #fff; stroke: #14344B; stroke-width: 1.4; } .th { fill: #14344B; }
.tt { fill: #fff; font: 700 12px Consolas, monospace; text-anchor: middle; }
.cl, .pk, .fk { font: 11px Consolas, monospace; fill: #221D17; }
.pk { font-weight: 700; fill: #7A2E25; } .fk { fill: #3F6B4A; font-style: italic; }
.ty { font: 700 9px Consolas, monospace; fill: #7A7266; }
.ln { fill: none; stroke: #5B5347; stroke-width: 1.4; }
.card { font: 700 12px Arial; fill: #B5652E; } .note { font: 10px Arial; fill: #5B5347; font-style: italic; }
.en { fill: #FAF5EC; stroke: #14344B; stroke-width: 2; } .et { font: 700 13px Arial; fill: #14344B; text-anchor: middle; }
.es { font: 10px Arial; fill: #5B5347; text-anchor: middle; }
.dm { fill: #fff; stroke: #B5652E; stroke-width: 1.6; } .dt { font: 11px Arial; fill: #221D17; text-anchor: middle; }
.leg { font-size: 9pt; color: #5B5347; margin-top: 8px; }
ul { margin: 4px 0 10px 18px; padding: 0; } li { margin-bottom: 3px; }
'''

ORDER = ['usuario', 'endereco', 'categoria', 'produto', 'produto_arquivo', 'pedido', 'item_pedido']

doc = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Modelagem do Banco de Dados - entre linhas</title><style>{CSS}</style></head><body>
<section class="capa">
<h1>Modelagem do Banco de Dados</h1>
<div class="sub">E-commerce “entre linhas” — marketplace de livros e infoprodutos digitais<br>Projeto Integrador · 3º Ano do Ensino Técnico</div>
<dl><dt>Equipe</dt><dd></dd><dt>Integrantes</dt><dd></dd><dt>Turma</dt><dd></dd><dt>Professor(a)</dt><dd></dd><dt>Data</dt><dd></dd><dt>SGBD</dt><dd>MySQL 8 / MariaDB 10.4+ (InnoDB, utf8mb4)</dd><dt>Banco</dt><dd>entrelinhas (7 tabelas)</dd></dl>
</section>

<section class="pg"><h2>1. Diagrama Entidade-Relacionamento — Modelo Conceitual</h2>
<p>A loja vende produtos digitais (livros, guias, planilhas e cursos) de autores independentes. Um <b>usuário</b> pode ter vários endereços, realizar vários pedidos e, se for autor, publicar vários produtos. Cada produto pertence a uma categoria e possui um ou mais arquivos. Pedidos e produtos formam uma relação muitos-para-muitos, resolvida pela tabela associativa item_pedido.</p>
{conceptual_svg()}
<p class="leg">Retângulos: entidades · Losangos: relacionamentos · 1, N e M: cardinalidades.</p></section>

<section class="pg"><h2>2. Diagrama Entidade-Relacionamento — Modelo Lógico</h2>
{logical_svg()}
<p class="leg"><b style="color:#7A2E25">Negrito</b> = chave primária (PK) · <i style="color:#3F6B4A">itálico</i> = chave estrangeira (FK) · linhas: 1 (lado “um”) e N (lado “muitos”).</p></section>

<section class="pg"><h2>3. Dicionário de Dados</h2>
<p>Restrições gerais: todas as tabelas usam InnoDB e utf8mb4. As colunas de identificador são INT UNSIGNED AUTO_INCREMENT. Todas as FKs usam ON UPDATE CASCADE.</p>
{''.join(dict_table(n) for n in ORDER)}
</section>

<section class="pg"><h2>4. Decisões de projeto e integridade</h2>
<ul>
<li><b>Perfis de acesso:</b> o campo <span class="mono">perfil</span> cobre cliente e administrador, como pedido no enunciado. Foi acrescentado o perfil <b>autor</b> porque o protótipo do front-end tem painel e cadastro de produto para quem publica.</li>
<li><b>Preço congelado no pedido:</b> <span class="mono">item_pedido.valor_unitario</span> guarda o preço do momento da compra. Alterar <span class="mono">produto.preco_venda</span> depois não muda pedidos antigos.</li>
<li><b>Endereço sempre do comprador:</b> a FK composta <span class="mono">pedido(id_endereco, id_usuario) → endereco(id_endereco, id_usuario)</span> impede associar um pedido ao endereço de outra pessoa.</li>
<li><b>Sem duplicar produto no pedido:</b> UNIQUE (id_pedido, id_produto); para comprar mais de uma cópia usa-se <span class="mono">quantidade</span>.</li>
<li><b>Histórico preservado:</b> usuário, produto e categoria usam ON DELETE RESTRICT quando referenciados por pedidos/produtos. Apagar um usuário apaga seus endereços; apagar um pedido apaga seus itens.</li>
<li><b>Estoque em produto digital:</b> <span class="mono">estoque_disponivel</span> existe por exigência do enunciado e pode representar um limite de licenças/cópias. Para venda ilimitada usa-se um valor alto.</li>
<li><b>Restrições CHECK:</b> preço &gt; 0, estoque ≥ 0, quantidade &gt; 0, valor unitário &gt; 0, total ≥ 0, tamanho do arquivo &gt; 0 e CEP com 8 dígitos.</li>
<li><b>Senhas:</b> a coluna guarda apenas o hash; os hashes da carga de testes são exemplos, não correspondem a senhas reais.</li>
</ul></section>
</body></html>'''

open('documentacao.html', 'w', encoding='utf-8').write(doc)
print('ok')
