// Conteúdo didático do Manual de uso: para que serve cada página e o que faz cada botão.
// Chave = id da página em InstrucoesScreen (PAGINAS).

export type BotaoManual = { b: string; faz: string };

export const PARA_QUE_SERVE: Record<string, string> = {
  inicio:
    "É o “painel do carro” da rede: em poucos segundos você vê se o mês está indo bem, quanto as lojas venderam, quanto sobrou de lucro e se alguma loja precisa de atenção.",
  analitico:
    "Serve para analisar com calma. É aqui que você compara uma loja com a outra, vê quanto vai de royalties para a matriz e descobre quais contas estão apertando o caixa.",
  rotinas:
    "É a agenda de contas a pagar. Funciona como um lembrete: você cadastra a conta uma vez (até com repetição mensal) e o sistema mostra o que está vencido, o que vence logo e o que já foi pago.",
  conciliacao:
    "Serve para conferir o banco com o sistema sem digitar nada. Você joga o extrato do banco e o sistema separa o que já bate com os lançamentos do que você ainda precisa conferir.",
  lancamentos:
    "É o caderno de entradas e saídas. Tudo o que entrou ou saiu de dinheiro e não veio do extrato você anota aqui. Esses números alimentam o DRE e os relatórios.",
  vt:
    "Serve para calcular e pagar o vale-transporte de cada colaborador do jeito certo: desconta as faltas, soma corridas extras (Uber, 99, táxi), respeita o limite de 6% do salário e gera o recibo para a pessoa assinar.",
  dre:
    "Responde a pergunta “a loja deu lucro?”. Mostra, em ordem, quanto entrou, quanto saiu em custos e despesas e quanto sobrou no final, no período e nas lojas que você escolher.",
  taxas:
    "Serve para saber quanto do dinheiro de cada venda realmente chega na conta e quando, conforme o meio de pagamento (PIX, débito, crédito etc.).",
  rede:
    "É a vitrine de todas as lojas da rede. Mostra o tamanho da rede, o resultado de cada unidade e quais estão bem ou precisando de atenção.",
  produtos:
    "É o catálogo oficial de compras. Mostra o que cada loja pode comprar e de qual fornecedor, para todas comprarem igual.",
  funcionarios:
    "É a ficha de cada pessoa que trabalha nas lojas. É daqui que o VT puxa os colaboradores, e daqui também dá para criar o login de quem vai usar o sistema.",
  acessos:
    "É a portaria do sistema: decide quem entra, com qual senha, em qual loja e o que pode fazer lá dentro.",
  "config-preferencias":
    "Define a identidade do sistema: o nome que aparece no topo, a razão social da franqueadora, a moeda e as cores (claro ou escuro).",
  "config-marcas":
    "Cria as marcas da rede (ex.: uma cafeteria e uma lavanderia). Toda loja precisa estar ligada a uma marca, então este é o primeiro cadastro.",
  "config-regras":
    "Guarda os números padrão que o sistema usa nas contas quando falta informação: imposto, CMV, royalty médio, desconto máximo e horário de corte do banco.",
  "config-transferencias":
    "Evita que dinheiro que só “trocou de bolso” entre empresas suas seja contado como venda ou despesa.",
  "config-dre":
    "Define os percentuais estimados (impostos, CMV, aluguel, folha etc.) usados no DRE e nas simulações, para a rede toda ou para uma loja específica.",
  "config-permissoes":
    "Mostra quem tem login e o que cada tipo de perfil pode ver e alterar.",
  "config-royalties":
    "Define quanto cada marca paga de royalty para a matriz, em porcentagem do faturamento.",
  "config-fornecedores":
    "É onde a matriz monta o catálogo oficial: cadastra produtos e fornecedores que depois aparecem para todas as lojas.",
  "config-franqueados":
    "É o cadastro das lojas: código, nome, marca, responsável, cidade e se está ativa.",
  "config-auditoria":
    "É o histórico de segurança: mostra quem alterou o quê e quando.",
};

export const BOTOES: Record<string, BotaoManual[]> = {
  inicio: [
    { b: "Resetar Filtros", faz: "Volta ano, mês, marca e unidade para o padrão (mês atual, rede toda)." },
    { b: "Ano / Mês / Dia", faz: "Escolhe o período que os cartões e o mapa vão mostrar." },
    { b: "Rede / Marca e Unidade", faz: "Mostra só os números de uma marca ou de uma loja." },
    { b: "Todas / Saudáveis / Atenção", faz: "Filtra as lojas no mapa pela situação delas." },
    { b: "+ e − do mapa", faz: "Aproximam ou afastam o mapa." },
    { b: "Mudar Visão", faz: "Troca o sistema inteiro para a visão daquela loja (como escolher a loja no menu lateral)." },
  ],
  analitico: [
    { b: "Redefinir Filtros Padrão", faz: "Volta todos os filtros para o padrão." },
    { b: "Abrir contas a pagar →", faz: "Leva para Pagamentos e Despesas para você resolver as contas vencidas." },
    { b: "Consolidado da Rede", faz: "Mostra os números de todas as lojas somados." },
    { b: "Abrir KPIs da Loja", faz: "Mostra vendas, margem e ticket médio de uma loja só." },
    { b: "Rótulos: Ligados / Desligados", faz: "Mostra ou esconde os valores escritos em cima das barras dos gráficos." },
    { b: "Ampliar", faz: "Abre o gráfico em tamanho grande." },
    { b: "Exportar CSV", faz: "Baixa os números em planilha (abre no Excel)." },
    { b: "Ver DRE Completo", faz: "Abre o DRE com os mesmos filtros." },
    { b: "Nome de uma loja no gráfico", faz: "Passa a ver o sistema daquela loja." },
  ],
  rotinas: [
    { b: "Botões dos cartões (Vencidas / A vencer / No prazo)", faz: "Filtram a lista para mostrar só aquele grupo de contas." },
    { b: "+ Gerar N compromissos recorrentes", faz: "Salva a conta nova. Se você escolheu repetir por vários meses, cria uma conta para cada mês." },
    { b: "Exportar Excel", faz: "Baixa a lista de contas em planilha." },
    { b: "Status da conta (Vencida / Próxima / No prazo / Paga)", faz: "Clique para marcar a conta como paga (dar baixa). Clique de novo para desfazer." },
    { b: "Editar (lápis)", faz: "Abre a conta para mudar descrição, valor, data ou categoria. Depois clique em Salvar Alterações." },
    { b: "Excluir (lixeira)", faz: "Apaga a conta da agenda." },
    { b: "Limpar filtros", faz: "Tira todos os filtros da lista." },
  ],
  conciliacao: [
    { b: "Selecionar base (ou arrastar o arquivo)", faz: "Lê o extrato do banco. Ainda não grava nada, só mostra o que encontrou." },
    { b: "Destino dos lançamentos", faz: "Diz de qual loja é aquele extrato." },
    { b: "Finalizar e enviar à Caixa", faz: "Grava no sistema as movimentações lidas do arquivo." },
    { b: "Descartar", faz: "Joga fora a leitura do arquivo sem gravar nada." },
    { b: "Aprovar Selecionados", faz: "Confirma as linhas marcadas como corretas (viram conciliadas)." },
    { b: "Rejeitar", faz: "Marca as linhas selecionadas como erradas para não entrarem nos números." },
    { b: "Remover Selecionados", faz: "Apaga do sistema as linhas marcadas." },
    { b: "Editar / Editar em Lote", faz: "Corrige descrição, categoria, data ou valor de uma linha, ou de várias de uma vez." },
    { b: "Varredura de Recorrências", faz: "Procura no extrato contas fixas (aluguel, internet, folha) e dá baixa sozinho nas contas a pagar correspondentes." },
    { b: "+ Nova Recorrência", faz: "Ensina o sistema a reconhecer uma conta fixa nova no extrato." },
    { b: "Reverter baixa", faz: "Desfaz uma baixa automática e reabre a conta a pagar." },
    { b: "Pendentes / Conciliados / Entre empresas / Todos", faz: "Mudam qual grupo de movimentações aparece na lista." },
    { b: "Registrar como entre empresas", faz: "Diz que aquele dinheiro só passou entre empresas suas: sai do DRE, mas fica guardado para auditoria." },
    { b: "Ver em Lançamentos", faz: "Abre a aba Lançamentos para conferir o que entrou." },
  ],
  lancamentos: [
    { b: "Ver no DRE", faz: "Abre o DRE para ver como os lançamentos mexeram no resultado." },
    { b: "Entrada / Despesa", faz: "Diz se o dinheiro entrou (venda, recebimento) ou saiu (conta, compra)." },
    { b: "Único / 3 Meses / 6 Meses / 12 Meses", faz: "Repete o mesmo lançamento nos próximos meses." },
    { b: "Salvar Lançamento", faz: "Grava o lançamento. Ele já aparece no histórico e no DRE." },
    { b: "Baixar PDF", faz: "Gera um relatório em PDF com os filtros que você escolheu." },
    { b: "Editar", faz: "Abre o lançamento no formulário para corrigir." },
    { b: "Remover (lixeira)", faz: "Apaga o lançamento." },
  ],
  vt: [
    { b: "Todos / A pagar / Pagos em parte / Quitados", faz: "Filtram a lista de colaboradores pela situação do VT no mês." },
    { b: "Recalcular dias", faz: "Conta de novo os dias de trabalho do mês pela escala de cada pessoa." },
    { b: "Ícone de ajustes (ao lado de Recalcular)", faz: "Coloca a mesma quantidade de dias para vários colaboradores de uma vez. Depois clique em Aplicar." },
    { b: "Recarga", faz: "Baixa o arquivo para pedir a recarga dos cartões na operadora de transporte." },
    { b: "Folha", faz: "Baixa o resumo dos descontos de VT para mandar à contabilidade." },
    { b: "+ Colaborador", faz: "Coloca no VT uma pessoa que já está em Funcionários." },
    { b: "Salvar", faz: "Grava as mudanças feitas na tela (faltas, dias etc.)." },
    { b: "− e + (Faltas)", faz: "Tiram ou lançam 1 falta. Cada falta tira 1 dia de VT." },
    { b: "Uber / extra", faz: "Abre a janela para lançar uma corrida paga pela empresa (Uber, 99, táxi). O número vermelho mostra quantas ainda não foram pagas." },
    { b: "Pagar", faz: "Registra o pagamento do VT (passagens + corridas a pagar) e cria o recibo e as linhas no extrato." },
    { b: "Histórico e recibos (relógio)", faz: "Mostra todos os pagamentos daquela pessoa." },
    { b: "Ver / Imprimir Recibo", faz: "Abre o recibo para imprimir, salvar em PDF ou enviar por e-mail." },
    { b: "Excluir lançamento (no histórico)", faz: "Cancela um pagamento. As corridas dele voltam a ficar A pagar." },
    { b: "Editar (lápis)", faz: "Muda transportes, tarifas, escala, faltas e permite Lançar corrida." },
    { b: "Remover colaborador (lixeira)", faz: "Tira a pessoa do VT (o cadastro em Funcionários continua)." },
    { b: "Ir para Funcionários", faz: "Aparece quando a loja não tem ninguém no VT: leva para cadastrar a equipe." },
  ],
  dre: [
    { b: "Demonstrativo DRE / Extrato", faz: "Alternam entre a tabela do resultado e a lista de entradas e saídas que formam esse resultado." },
    { b: "Ano / Mês / Dia, Marca e Unidade", faz: "Escolhem o período e as lojas do relatório." },
    { b: "Redefinir Filtros", faz: "Volta para o mês atual e a rede toda." },
    { b: "Baixar Tabela DRE (.csv)", faz: "Baixa o DRE em planilha (abre no Excel)." },
    { b: "Baixar PDF da Planilha", faz: "Baixa o DRE em PDF, com o nome da loja e o período." },
    { b: "Imprimir", faz: "Imprime ou salva em PDF pelo navegador." },
  ],
  taxas: [
    { b: "Campos de taxa, prazo e horário de corte", faz: "Onde você digita o que a maquininha ou o banco cobra em cada meio de pagamento." },
    { b: "Salvar Regras", faz: "Grava as taxas e prazos para o sistema usar nas previsões." },
    { b: "Simulador (valor, meio, desconto, parcelas)", faz: "Mostra na hora quanto cai na conta e em que dia." },
  ],
  rede: [
    { b: "Cadastrar Novo Franqueado", faz: "Abre o cadastro de uma loja nova." },
    { b: "Ver Mapa na Página", faz: "Rola a tela até o mapa das lojas." },
    { b: "Atualizar", faz: "Busca os dados mais recentes (útil se outra pessoa acabou de mexer)." },
    { b: "Todas as Unidades / filtros", faz: "Escolhem quais lojas aparecem nos cartões." },
    { b: "Ver DRE (no cartão da loja)", faz: "Abre o resultado só daquela loja." },
  ],
  produtos: [
    { b: "Produtos / Fornecedores", faz: "Alternam entre a lista de produtos e a lista de fornecedores." },
    { b: "Filtros de categoria e status", faz: "Mostram só os itens de uma categoria ou situação (Ativo, Inativo, Pendente)." },
  ],
  funcionarios: [
    { b: "Novo funcionário", faz: "Abre a ficha para cadastrar uma pessoa." },
    { b: "Busca", faz: "Procura pelo nome, cargo, matrícula ou loja." },
    { b: "Lápis (no cartão)", faz: "Abre a ficha para alterar ou desativar a pessoa." },
    { b: "Recebe vale-transporte (na ficha)", faz: "Quando marcado, a pessoa aparece na aba VT da loja." },
    { b: "Cadastro ativo (na ficha)", faz: "Desmarque quando a pessoa sair da empresa: o histórico fica guardado." },
    { b: "Salvar funcionário", faz: "Grava a ficha (e cria o login, se você preencheu)." },
    { b: "Cancelar", faz: "Fecha a ficha sem salvar." },
  ],
  acessos: [
    { b: "Novo acesso", faz: "Cria um login: nome, usuário, senha, nível e loja." },
    { b: "Editar", faz: "Muda nível, loja ou cadastra uma senha nova." },
    { b: "Bloquear / Desbloquear", faz: "Impede (ou volta a permitir) a entrada daquela pessoa, sem apagar o cadastro." },
  ],
  "config-preferencias": [
    { b: "Atualizar", faz: "Recarrega as configurações salvas." },
    { b: "Abas do topo", faz: "Cada aba abre uma parte das configurações (marcas, regras, royalties etc.)." },
    { b: "Salvar Preferências", faz: "Grava nome do sistema, razão social, moeda e tema." },
    { b: "Apagar dados operacionais", faz: "Apaga lojas, lançamentos, contas, funcionários e VT. Pede para você digitar APAGAR DADOS. Não tem volta: use só para começar do zero." },
  ],
  "config-marcas": [
    { b: "Cadastrar Novo Modelo / Marca", faz: "Cria uma marca nova com o royalty padrão." },
    { b: "Editar", faz: "Muda nome ou royalty da marca." },
    { b: "Excluir", faz: "Apaga a marca (faça só se não houver loja ligada a ela)." },
  ],
  "config-regras": [
    { b: "Todas / Geral / Regras de Negócio / Segurança / Operação", faz: "Filtram as regras por assunto." },
    { b: "Salvar (em cada regra)", faz: "Grava só aquela regra." },
    { b: "Salvar Todos da Categoria", faz: "Grava todas as regras da categoria aberta de uma vez." },
  ],
  "config-transferencias": [
    { b: "Salvar regra", faz: "Grava a regra com as palavras do extrato e o alcance escolhido." },
    { b: "Editar regra", faz: "Abre uma regra existente para mudar. Clique em Salvar alterações para gravar ou Cancelar edição para desistir." },
    { b: "Excluir regra", faz: "Apaga a regra. Os próximos extratos deixam de ser separados por ela." },
  ],
  "config-dre": [
    { b: "Seletor (Rede ou loja)", faz: "Escolhe se os percentuais valem para a rede toda ou para uma loja." },
    { b: "Restaurar Padrão", faz: "Volta os percentuais para os valores padrão da franqueadora." },
    { b: "Salvar Parâmetros", faz: "Grava os percentuais." },
    { b: "Aplicar ao DRE desta Unidade", faz: "Passa a usar esses percentuais no DRE da loja escolhida." },
  ],
  "config-permissoes": [
    { b: "Criar novo acesso", faz: "Cria um login novo com nível e escopo." },
    { b: "Bloquear", faz: "Suspende o acesso daquela pessoa." },
  ],
  "config-royalties": [
    { b: "Campo % de cada marca", faz: "Onde você digita o novo percentual. A simulação para R$ 50 mil muda na hora." },
    { b: "Salvar Taxas", faz: "Grava os novos royalties. O DRE e os relatórios passam a usar esse valor." },
    { b: "Cadastrar Nova Marca", faz: "Cria uma marca nova já com o royalty." },
  ],
  "config-fornecedores": [
    { b: "Produtos Homologados / Fornecedores Homologados", faz: "Alternam entre as duas listas." },
    { b: "Cadastrar Novo Produto", faz: "Abre o formulário para cadastrar um produto e escolher o fornecedor homologado dele." },
    { b: "Lápis (Editar Produto)", faz: "Altera os dados do produto, como fornecedor, código e status." },
    { b: "Lixeira (Excluir Produto)", faz: "Apaga o produto do catálogo." },
  ],
  "config-franqueados": [
    { b: "Cadastrar Novo Franqueado", faz: "Cria uma loja nova." },
    { b: "Todas / Ativas / Inativas", faz: "Filtram a lista de lojas." },
    { b: "Alterar", faz: "Abre a loja para mudar dados ou desativar. Clique em Salvar & Fixar Alterações para gravar." },
  ],
  "config-auditoria": [
    { b: "Atualizar", faz: "Busca os registros mais recentes." },
  ],
};
