/* Dados de exemplo do protótipo. Títulos, autores e preços são fictícios. */
(function () {
  const CATEGORIAS = [
    { id: 'ficcao', nome: 'Ficção', cor: '#14344B', altura: 230 },
    { id: 'cronicas', nome: 'Crônicas e poesia', cor: '#B5652E', altura: 196 },
    { id: 'financas', nome: 'Finanças pessoais', cor: '#3F6B4A', altura: 214 },
    { id: 'arte', nome: 'Arte e imagem', cor: '#7A2E25', altura: 240 },
    { id: 'culinaria', nome: 'Culinária', cor: '#D9A441', altura: 184, lite: true },
    { id: 'tecnologia', nome: 'Tecnologia', cor: '#0E2635', altura: 222 },
    { id: 'autores', nome: 'Para quem escreve', cor: '#5E7F94', altura: 204 },
    { id: 'modelos', nome: 'Modelos e cursos', cor: '#5B5347', altura: 236 }
  ];

  const LIVROS = [
    {
      id: 'o-peso-das-manhas-curtas', titulo: 'O Peso das Manhãs Curtas', linhas: ['O Peso', 'das Manhãs', 'Curtas'],
      sub: 'Onze contos sobre quem acorda antes do resto da casa.',
      autor: 'Helena Arruda Moura', cat: 'ficcao', preco: 24.9, nota: 4.8, aval: 312, vendas: 1840, paginas: 186,
      formatos: [['EPUB', '1,4 MB'], ['PDF', '2,1 MB']], novo: true, semana: true,
      capa: { motif: 'sol', bg: '#14344B', fg: '#FAF5EC', ac: '#D98A4E' },
      bio: 'Helena é revisora de textos em Belo Horizonte e escreve contos no ônibus, entre a casa e a gráfica onde trabalha.',
      desc: [
        'Uma padeira que conta os minutos até o forno esfriar. Um vigia noturno que aprende libras com a filha. Um pai que descobre, aos cinquenta, que nunca viu o sol nascer da própria janela.',
        'São onze histórias curtas, pensadas para caber numa viagem de metrô ou numa pausa de café. O livro foi editado por conta própria, revisado três vezes e nunca passou por catálogo de grande editora.'
      ],
      trecho: [
        'Dona Nazaré acendia o forno às quatro e vinte, nem um minuto depois. Não era pontualidade, era medo: se atrasasse, a rua inteira perceberia que ela também podia falhar.',
        'O pão crescia devagar, indiferente a tudo. Ela se sentava no banquinho de madeira e ouvia o bairro respirar antes de acordar, e por alguns minutos aquele silêncio era só dela.',
        'Foi numa dessas manhãs que o menino do prédio da esquina bateu na porta dos fundos, descalço, pedindo um pão velho para o cachorro que não existia.'
      ],
      sumario: ['Quatro e vinte', 'A escada do prédio azul', 'Libras para a noite', 'O turno da Vera', 'Sol de fevereiro', 'Cartas sem selo'],
      avaliacoes: [
        { nome: 'Marcelo Tavares', cidade: 'Curitiba', nota: 5, texto: 'Li “Quatro e vinte” duas vezes seguidas. Mandei para minha mãe, que era padeira. Ela ligou chorando.' },
        { nome: 'Josiane Prado', cidade: 'Salvador', nota: 5, texto: 'Contos curtos que ficam na cabeça o dia inteiro. O PDF abriu bem no celular.' },
        { nome: 'Antônio Beltrão', cidade: 'Porto Alegre', nota: 4, texto: 'Dois contos me pareceram mais fracos, mas o conjunto vale cada centavo.' }
      ]
    },
    {
      id: 'planilhas-que-sobrevivem-a-marco', titulo: 'Planilhas que Sobrevivem a Março', linhas: ['Planilhas', 'que Sobrevivem', 'a Março'],
      sub: 'Um método de orçamento para quem já abandonou três apps de finanças.',
      autor: 'Rafael Tenório', cat: 'financas', preco: 39, nota: 4.7, aval: 528, vendas: 3120, paginas: 132,
      formatos: [['PDF', '3,8 MB'], ['XLSX', '640 KB']], novo: false,
      capa: { motif: 'grade', bg: '#3F6B4A', fg: '#FAF5EC', ac: '#E8B05C' },
      bio: 'Rafael foi analista de crédito por nove anos e agora ensina orçamento doméstico para quem tem renda irregular.',
      desc: [
        'A maioria dos orçamentos morre em março, quando a empolgação de janeiro passa e a fatura do cartão chega. Este guia parte disso e monta uma planilha que aceita mês ruim.',
        'Você recebe o PDF com o método explicado em 132 páginas e a planilha em XLSX, já com fórmulas para renda variável, parcelamentos e reserva de emergência.'
      ],
      trecho: [
        'Em março de 2019 eu tinha quatro planilhas, dois aplicativos e nenhuma ideia de quanto gastei no mês. Todas as ferramentas estavam certas. O problema era que nenhuma delas previa um mês ruim.',
        'Por isso a primeira aba deste método não pergunta quanto você ganha. Ela pergunta quanto você precisa para não entrar em pânico.'
      ],
      sumario: ['Por que o orçamento morre em março', 'A aba do pânico', 'Renda que oscila', 'Parcelas: onde mora o perigo', 'Reserva em três degraus', 'Revisão de domingo'],
      avaliacoes: [
        { nome: 'Camila Duarte', cidade: 'Goiânia', nota: 5, texto: 'Sou autônoma e finalmente uma planilha que entende que março pode vir com metade do dinheiro.' },
        { nome: 'Wagner Lopes', cidade: 'Recife', nota: 4, texto: 'A planilha é boa. Faltou um exemplo de casal com contas separadas, mas o autor respondeu meu e-mail em um dia.' }
      ]
    },
    {
      id: 'caderno-de-bordas', titulo: 'Caderno de Bordas', linhas: ['Caderno', 'de Bordas'],
      sub: 'Ilustração com nanquim, do primeiro traço à última mancha.',
      autor: 'Iara Quintela', cat: 'arte', preco: 49.9, nota: 4.9, aval: 187, vendas: 902, paginas: 120,
      formatos: [['PDF', '48 MB']], novo: false,
      capa: { motif: 'traco', bg: '#EFE6D2', fg: '#221D17', ac: '#B5652E' },
      bio: 'Iara é ilustradora em Olinda e dá oficinas de nanquim em uma livraria de rua desde 2016.',
      desc: [
        'Sessenta exercícios para praticar com uma caneta, um pincel e um vidro de nanquim. Cada página tem espaço para você desenhar por cima, se imprimir.',
        'O PDF vem em alta resolução, com margens pensadas para impressão caseira em A4 e para uso em tablet.'
      ],
      trecho: [
        'Nanquim não perdoa e é por isso que ele ensina. Cada traço fica onde caiu, e você aprende a decidir antes de encostar o pincel no papel.',
        'Comece pelas bordas. Antes de desenhar qualquer figura, desenhe o limite dela: uma moldura torta, um retângulo que treme. As bordas contam o que o desenho quer esconder.'
      ],
      sumario: ['Materiais e como não desperdiçar tinta', 'Linhas que tremem', 'Hachuras', 'Manchas planejadas', 'Bordas e molduras', 'Composição em página dupla'],
      avaliacoes: [
        { nome: 'Luísa Fontenele', cidade: 'Fortaleza', nota: 5, texto: 'Imprimi em papel 120 g e usei o caderno inteiro. Meu traço mudou em três semanas.' },
        { nome: 'Otávio Reis', cidade: 'São Paulo', nota: 5, texto: 'Os exercícios de mancha planejada valem o preço sozinhos.' }
      ]
    },
    {
      id: 'vinte-e-tres-receitas-de-domingo', titulo: 'Vinte e Três Receitas de Domingo', linhas: ['Vinte e', 'Três Receitas', 'de Domingo'],
      sub: 'Comida de panela grande, escrita por quem cozinhou para doze pessoas por trinta anos.',
      autor: 'Aparecida “Cidinha” Lopes', cat: 'culinaria', preco: 19.9, nota: 4.9, aval: 641, vendas: 4275, paginas: 74,
      formatos: [['PDF', '9 MB'], ['EPUB', '5 MB']], novo: false,
      capa: { motif: 'prato', bg: '#D9A441', fg: '#221D17', ac: '#A23B2E' },
      bio: 'Dona Cidinha tem 71 anos, mora em Uberaba e escreveu o livro ditando para a neta, que digitou tudo nas férias de julho.',
      desc: [
        'Feijoada de quarta, galinhada, quibebe, doce de leite de tacho. Nada de “pitada”: aqui as medidas estão em xícaras e colheres, porque a neta pesou tudo.',
        'Cada receita rende para oito a doze pessoas, com dicas de como dividir por dois e como aproveitar as sobras na segunda.'
      ],
      trecho: [
        'Domingo sem panela grande no fogo não é domingo. Se você só sabe cozinhar para duas pessoas, comece por aqui: a quantidade certa é a que sobra.',
        'A galinhada pede um frango caipira de dois quilos, mas se você só achar de granja, use o dobro do açafrão e tenha paciência. Quem tem pressa deve comer outra coisa.'
      ],
      sumario: ['A panela certa', 'Galinhada de domingo', 'Feijoada de quarta', 'Quibebe com carne-seca', 'Doce de leite de tacho', 'O que fazer na segunda'],
      avaliacoes: [
        { nome: 'Rosângela Mattos', cidade: 'Uberlândia', nota: 5, texto: 'Fiz a galinhada para 10 pessoas e não sobrou uma colher. Dona Cidinha merece um prêmio.' },
        { nome: 'Pedro Henrique', cidade: 'Campinas', nota: 5, texto: 'Comprei para minha avó, que nunca usou computador. Ela imprimiu e agora cozinha por ele.' }
      ]
    },
    {
      id: 'sem-filtro-de-cidade-pequena', titulo: 'Sem Filtro de Cidade Pequena', linhas: ['Sem Filtro', 'de Cidade', 'Pequena'],
      sub: 'Trinta e duas crônicas sobre voltar para onde todo mundo sabe seu nome.',
      autor: 'Túlio Baracho', cat: 'cronicas', preco: 14.9, nota: 4.6, aval: 98, vendas: 411, paginas: 142,
      formatos: [['EPUB', '900 KB'], ['PDF', '1,6 MB']], novo: true,
      capa: { motif: 'cidade', bg: '#0E2635', fg: '#EFE6D2', ac: '#E3A06B' },
      bio: 'Túlio voltou para Diamantina depois de doze anos em São Paulo. Escreve uma crônica por semana para o jornal da paróquia.',
      desc: [
        'A padaria fecha ao meio-dia, o prefeito pega carona no ônibus escolar e todo mundo sabe quem chegou de mala na rodoviária. Crônicas para rir, e às vezes para engolir seco.',
        'Cada texto tem entre duas e quatro páginas. Dá para ler um antes de dormir sem perder o sono.'
      ],
      trecho: [
        'Voltei para Diamantina numa terça de chuva e antes de descer do ônibus três pessoas já tinham me avisado que minha mãe estava sabendo. Cidade pequena não tem notícia, tem transmissão ao vivo.',
        'Na padaria, seu Almir me entregou o pão sem que eu pedisse. Ele lembrava do pedido de 2011.'
      ],
      sumario: ['A rodoviária', 'Seu Almir e o pão de 2011', 'A missa das sete', 'Onde fica o silêncio', 'Nome e apelido', 'Quem ficou'],
      avaliacoes: [
        { nome: 'Fernanda Lacerda', cidade: 'Montes Claros', nota: 5, texto: 'Reconheci minha cidade em cada página. Ri alto no ônibus.' },
        { nome: 'Gilberto Assis', cidade: 'Belo Horizonte', nota: 4, texto: 'Ótimo. Só queria que fosse mais longo.' }
      ]
    },
    {
      id: 'python-para-noites-livres', titulo: 'Python para Quem Só Tem Noites Livres', linhas: ['Python', 'para Quem Só', 'Tem Noites', 'Livres'],
      sub: 'Trinta noites de uma hora para automatizar seu próprio trabalho.',
      autor: 'Marina Sabóia', cat: 'tecnologia', preco: 59, nota: 4.8, aval: 274, vendas: 1530, paginas: 248,
      formatos: [['PDF', '6 MB'], ['ZIP', '2,2 MB']], novo: false,
      capa: { motif: 'codigo', bg: '#5E7F94', fg: '#0E2635', ac: '#FAF5EC' },
      bio: 'Marina é engenheira de dados em Florianópolis. Aprendeu a programar à noite, depois do expediente na contabilidade.',
      desc: [
        'Trinta lições curtas, cada uma com um problema real: renomear mil arquivos, juntar planilhas de fornecedores, mandar o relatório de segunda sem tocar no teclado.',
        'O arquivo ZIP traz os exercícios prontos e as soluções comentadas. Nada de instalar nada além do Python.'
      ],
      trecho: [
        'Você não precisa de um curso de seis meses. Precisa de uma tarefa chata que se repete todo dia e de uma hora depois do jantar.',
        'Na primeira noite vamos escrever um programa de nove linhas que renomeia todos os arquivos de uma pasta. Se ele funcionar, você já vai ter economizado uma tarde.'
      ],
      sumario: ['Noite 1: nove linhas que renomeiam tudo', 'Noite 5: planilhas que se juntam sozinhas', 'Noite 12: e-mail automático de segunda', 'Noite 18: baixando dados de um site', 'Noite 24: gráficos legíveis', 'Noite 30: seu primeiro projeto'],
      avaliacoes: [
        { nome: 'Leandro Freire', cidade: 'Vitória', nota: 5, texto: 'Automatizei o fechamento mensal do meu setor na noite 9. Meu chefe achou que eu tinha contratado alguém.' },
        { nome: 'Sabrina Coutinho', cidade: 'Natal', nota: 5, texto: 'Didática rara. Erro comum vem explicado antes de eu cometer.' }
      ]
    },
    {
      id: 'guia-do-primeiro-livro-independente', titulo: 'Guia do Primeiro Livro Independente', linhas: ['Guia do', 'Primeiro Livro', 'Independente'],
      sub: 'Do arquivo do Word ao primeiro pagamento na conta, sem editora.',
      autor: 'Cauê Prado', cat: 'autores', preco: 34.9, nota: 4.7, aval: 163, vendas: 780, paginas: 156,
      formatos: [['PDF', '4,4 MB']], novo: false,
      capa: { motif: 'pilha', bg: '#EFE6D2', fg: '#14344B', ac: '#B5652E' },
      bio: 'Cauê publicou seis livros por conta própria e hoje presta consultoria de diagramação para autores estreantes.',
      desc: [
        'Revisão, capa, ISBN, formatos de arquivo, preço e divulgação, na ordem em que o trabalho realmente acontece. Com números de custo de quem já passou por isso.',
        'Inclui um checklist de lançamento em PDF e modelos de contrato com revisor e capista.'
      ],
      trecho: [
        'A primeira pergunta não é “como publico?”. É “para quem escrevi?”. Quem não responde isso gasta dois meses em capa e vende para os próprios parentes.',
        'Neste guia você vai gastar, no máximo, R$ 480 para colocar um livro de 150 páginas na loja. Vou mostrar onde cada real vai.'
      ],
      sumario: ['Para quem escrevi', 'Revisão: quando pagar e quando pedir favor', 'Capa que vende', 'ISBN e ficha catalográfica', 'Arquivo digital sem erro', 'Preço e lançamento'],
      avaliacoes: [
        { nome: 'Bianca Verdi', cidade: 'Joinville', nota: 5, texto: 'Segui o checklist e publiquei em seis semanas. Vendi 60 exemplares no primeiro mês.' },
        { nome: 'Ricardo Neves', cidade: 'Maceió', nota: 4, texto: 'Muito prático. A parte de divulgação podia ser mais longa.' }
      ]
    },
    {
      id: 'mapas-de-uma-casa-vazia', titulo: 'Mapas de Uma Casa Vazia', linhas: ['Mapas de', 'Uma Casa', 'Vazia'],
      sub: 'Poemas escritos depois da mudança, cômodo por cômodo.',
      autor: 'Nádia Ferrão', cat: 'cronicas', preco: 12, nota: 4.9, aval: 76, vendas: 302, paginas: 64,
      formatos: [['EPUB', '600 KB'], ['PDF', '1,1 MB']], novo: true,
      capa: { motif: 'casa', bg: '#7A2E25', fg: '#FAF5EC', ac: '#E8B05C' },
      bio: 'Nádia é professora de geografia em Pelotas e escreve poemas nas margens de provas corrigidas.',
      desc: [
        'Trinta e seis poemas curtos, um para cada cômodo de uma casa que foi esvaziada em uma tarde. Cada poema ocupa uma página, sem título, e se lê de pé.',
        'É o menor livro do catálogo e um dos mais relidos.'
      ],
      trecho: [
        'na cozinha / o cheiro demora mais que os móveis / para ir embora',
        'no quarto do fundo / o armário aberto / é um mapa sem legenda'
      ],
      sumario: ['Sala', 'Cozinha', 'Corredor', 'Quarto do fundo', 'Banheiro', 'Quintal'],
      avaliacoes: [
        { nome: 'Isadora Mello', cidade: 'Pelotas', nota: 5, texto: 'Pequeno e enorme. Li o livro em vinte minutos e passei uma semana pensando nele.' }
      ]
    },
    {
      id: 'fotografia-com-luz-de-janela', titulo: 'Fotografia com Luz de Janela', linhas: ['Fotografia', 'com Luz', 'de Janela'],
      sub: 'Minicurso em vídeo: retratos e naturezas-mortas sem estúdio nem flash.',
      autor: 'Beto Sampaio', cat: 'modelos', preco: 89, nota: 4.8, aval: 209, vendas: 1120, paginas: null, tipo: 'Curso em vídeo',
      formatos: [['MP4', '1,2 GB'], ['PDF', '3 MB']], novo: false,
      capa: { motif: 'janela', bg: '#221D17', fg: '#FAF5EC', ac: '#E8B05C' },
      bio: 'Beto fotografa para revistas de decoração há catorze anos e gravou o curso na sala de casa, em Santos.',
      desc: [
        'Seis aulas curtas, gravadas em uma sala com uma janela. Você aprende a ler a direção da luz, usar rebatedor de papelão e escolher a hora certa do dia.',
        'Tudo pode ser feito com celular ou câmera básica. Acompanha um caderno em PDF com os exercícios de cada aula.'
      ],
      trecho: [
        'Uma janela é o melhor equipamento de estúdio que você já tem. Só que ela muda de humor a cada quinze minutos, e você precisa aprender a perceber.',
        'Comece fotografando uma xícara às nove, às onze e às quinze. Só isso. Depois me diga qual das três parece mais honesta.'
      ],
      sumario: ['Aula 1: ler a luz', 'Aula 2: rebatedor de papelão', 'Aula 3: retrato de perfil', 'Aula 4: natureza-morta', 'Aula 5: hora dourada em ambiente fechado', 'Aula 6: edição leve'],
      avaliacoes: [
        { nome: 'Thaís Bittencourt', cidade: 'Niterói', nota: 5, texto: 'Fiz o exercício da xícara e entendi de uma vez por que minhas fotos eram chapadas.' },
        { nome: 'Mauro Gusmão', cidade: 'Belém', nota: 4, texto: 'Aulas objetivas. Gostaria de mais uma sobre luz de fim de tarde.' }
      ]
    },
    {
      id: 'pack-notion-para-leitores', titulo: 'Pack Notion para Leitores', linhas: ['Pack Notion', 'para', 'Leitores'],
      sub: 'Estante, metas de leitura e fichamentos em um só espaço.',
      autor: 'Lia Cordeiro', cat: 'modelos', preco: 22, nota: 4.6, aval: 131, vendas: 960, paginas: null, tipo: 'Modelo',
      formatos: [['Notion', 'link'], ['PDF', '1,8 MB']], novo: false,
      capa: { motif: 'checklist', bg: '#FAF5EC', fg: '#14344B', ac: '#B5652E' },
      bio: 'Lia é bibliotecária escolar em Recife e organiza clubes de leitura desde 2014.',
      desc: [
        'Quatro páginas prontas para duplicar no seu Notion: estante de lidos e a ler, meta anual com barra de progresso, ficha de citações e diário de leitura.',
        'O PDF traz o passo a passo em imagens, para quem nunca usou o aplicativo.'
      ],
      trecho: [
        'Uma estante boa mostra o que você leu e o que ainda está esperando por você, sem culpa. Comece com dez títulos, não com cem.',
        'A ficha de citações tem um campo chamado “por que marquei isto?”. É o único campo obrigatório.'
      ],
      sumario: ['Como duplicar o modelo', 'Estante', 'Metas do ano', 'Fichamento em cinco linhas', 'Diário de leitura'],
      avaliacoes: [
        { nome: 'Karina Soares', cidade: 'Recife', nota: 5, texto: 'O campo “por que marquei isto?” mudou minhas anotações.' },
        { nome: 'Felipe Tanaka', cidade: 'Londrina', nota: 4, texto: 'Bom modelo. Tive que adaptar para ficar do meu jeito, mas foi fácil.' }
      ]
    },
    {
      id: 'a-ultima-balsa-de-marajo', titulo: 'A Última Balsa de Marajó', linhas: ['A Última', 'Balsa de', 'Marajó'],
      sub: 'Um romance sobre três irmãos e a travessia que decide a herança.',
      autor: 'Renata Vasconcelos', cat: 'ficcao', preco: 27.9, nota: 4.7, aval: 224, vendas: 1360, paginas: 312,
      formatos: [['EPUB', '1,9 MB'], ['PDF', '3,4 MB']], novo: false,
      capa: { motif: 'rio', bg: '#5B5347', fg: '#FAF5EC', ac: '#E3A06B' },
      bio: 'Renata nasceu em Soure, viveu em Belém e escreve romances sobre rios desde que se mudou para o Sul.',
      desc: [
        'Três irmãos precisam atravessar o rio antes do meio-dia para assinar o inventário do pai. A balsa atrasa, o rio sobe e cada um carrega um segredo diferente.',
        'Um romance de 312 páginas, lido em uma semana por quase todos os leitores que responderam à nossa pesquisa.'
      ],
      trecho: [
        'A balsa saía quando o barqueiro quisesse, e naquele dia ele não queria. Olhou para os três irmãos como quem olha para o tempo antes da chuva.',
        'Marcos tinha o documento dobrado no bolso da camisa. Ana, a faca da cozinha na bolsa. Tomás só trouxe a mala, e era dela que vinha o cheiro de peixe.'
      ],
      sumario: ['Antes do meio-dia', 'A mala de Tomás', 'O barqueiro', 'Rio subindo', 'O inventário', 'Depois da travessia'],
      avaliacoes: [
        { nome: 'Denise Corrêa', cidade: 'Belém', nota: 5, texto: 'Li de uma sentada. O rio parece personagem.' },
        { nome: 'Heitor Mendes', cidade: 'Brasília', nota: 4, texto: 'Final um pouco apressado, mas a travessia é muito bem escrita.' }
      ]
    },
    {
      id: 'contabilidade-de-bolso-para-mei', titulo: 'Contabilidade de Bolso para MEI', linhas: ['Contabilidade', 'de Bolso', 'para MEI'],
      sub: 'DAS, nota fiscal e declaração anual explicados por uma contadora que atende feirantes.',
      autor: 'Sônia Ribeiro', cat: 'financas', preco: 29.9, nota: 4.8, aval: 355, vendas: 2210, paginas: 96,
      formatos: [['PDF', '2,7 MB']], novo: false,
      capa: { motif: 'barras', bg: '#B5652E', fg: '#FAF5EC', ac: '#0E2635' },
      bio: 'Sônia é contadora em Caruaru e atende, desde 2011, microempreendedores de feira e de comércio de bairro.',
      desc: [
        'O que pagar, quando pagar e o que guardar. Sem jargão, com exemplos de quem vende bolo, conserta bicicleta ou faz costura sob encomenda.',
        'Traz modelos de recibo, controle de caixa em uma página e o calendário fiscal do ano.'
      ],
      trecho: [
        'MEI não é “liberdade para não fazer conta”. É um jeito simples de fazer conta, e a conta continua existindo.',
        'Todo dia 20 vence o DAS. Coloque um lembrete no celular agora, antes de continuar a leitura. Eu espero.'
      ],
      sumario: ['O que é (e o que não é) ser MEI', 'DAS: quanto, quando, onde', 'Nota fiscal sem susto', 'Controle de caixa em uma página', 'Declaração anual', 'Quando deixar de ser MEI'],
      avaliacoes: [
        { nome: 'Eunice Barbosa', cidade: 'Caruaru', nota: 5, texto: 'Sou costureira e, pela primeira vez, entendi o que é a declaração anual.' },
        { nome: 'Douglas Rangel', cidade: 'Serra', nota: 5, texto: 'Direto ao ponto. O calendário fiscal já está colado na minha parede.' }
      ]
    }
  ];

  const USER_KEY = 'er_produtos_autor';
  function lerJSON(k, fallback) { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch (e) { return fallback; } }
  function gravarJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* armazenamento indisponível */ } }

  function todos() { return lerJSON(USER_KEY, []).concat(LIVROS); }
  function porId(id) { return todos().find(l => l.id === id); }
  function catNome(id) { const c = CATEGORIAS.find(c => c.id === id); return c ? c.nome : ''; }
  function brl(v) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function num1(v) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function taxaLiquido(preco) { const taxa = preco * 0.079 + 1; return { taxa, liquido: Math.max(0, preco - taxa) }; }

  const BIBLIOTECA_KEY = 'er_biblioteca';
  const BIBLIOTECA_SEMENTE = [
    { id: 'planilhas-que-sobrevivem-a-marco', progresso: 62, ultimo: 'Capítulo 4, Parcelas: onde mora o perigo' },
    { id: 'caderno-de-bordas', progresso: 35, ultimo: 'Exercício 21, Hachuras' },
    { id: 'vinte-e-tres-receitas-de-domingo', progresso: 88, ultimo: 'Receita 20, Doce de leite de tacho' },
    { id: 'python-para-noites-livres', progresso: 14, ultimo: 'Noite 4' }
  ];
  function biblioteca() { return lerJSON(BIBLIOTECA_KEY, BIBLIOTECA_SEMENTE); }
  function comprar(id) {
    const b = biblioteca();
    if (!b.find(x => x.id === id)) { b.unshift({ id, progresso: 0, ultimo: 'Ainda não aberto' }); gravarJSON(BIBLIOTECA_KEY, b); }
  }

  window.ER = { CATEGORIAS, LIVROS, todos, porId, catNome, brl, num1, taxaLiquido, lerJSON, gravarJSON, USER_KEY, biblioteca, comprar };
})();
