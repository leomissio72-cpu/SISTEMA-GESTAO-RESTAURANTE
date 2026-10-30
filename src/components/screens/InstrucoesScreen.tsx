import React, { useMemo, useState } from "react";
import { UserSession, ScreenType } from "../../types";
import {
  BookOpen,
  Search,
  ArrowRight,
  Home,
  TrendingUp,
  CreditCard,
  Percent,
  Building2,
  PackageCheck,
  Settings,
  Users,
  KeyRound,
  Shield,
  HelpCircle,
  Lightbulb,
  ListChecks,
  Rocket,
  MapPin,
  X,
  MousePointerClick,
  Target,
} from "lucide-react";
import { BOTOES, PARA_QUE_SERVE } from "./manualBotoes";

interface InstrucoesScreenProps {
  userSession: UserSession | null;
  onNavigate: (screen: ScreenType) => void;
}

type Pagina = {
  id: string;
  grupo: string;
  titulo: string;
  onde: string;
  icon: React.ReactNode;
  screen?: ScreenType;
  soMatriz?: boolean;
  resumo: string;
  temNaTela: string[];
  comoUsar: string[];
  dicas?: string[];
};

const PAGINAS: Pagina[] = [
  {
    id: "inicio",
    grupo: "Principal",
    titulo: "Início",
    onde: "Menu › Principal › Início",
    icon: <Home className="h-4 w-4" />,
    screen: "home",
    resumo: "A primeira tela depois do login. Mostra o resumo do mês e onde fica cada unidade.",
    temNaTela: [
      "Filtros de ano, mês, dia, rede/marca e unidade (o botão Resetar Filtros volta ao padrão).",
      "Quatro cartões: Faturamento filtrado, Lucro líquido apurado (com a margem), Pendências operacionais (conciliações a regularizar) e Rotinas em dia.",
      "Mapa das unidades com a saúde de cada loja: Saudáveis em verde e Atenção em amarelo.",
      "Lista das unidades no mapa com responsável, código e faturamento.",
    ],
    comoUsar: [
      "Escolha o mês e, se quiser, uma marca ou unidade nos filtros do topo.",
      "Leia os cartões para saber como está o faturamento e o lucro do período.",
      "No mapa, use Todas / Saudáveis / Atenção para ver só as lojas daquele grupo.",
      "Clique em Mudar Visão numa unidade para passar a ver o sistema só daquela loja.",
    ],
    dicas: ["Para voltar a ver a rede inteira, escolha Todas as unidades no seletor Franqueado do menu lateral."],
  },
  {
    id: "analitico",
    grupo: "Principal",
    titulo: "Analítico",
    onde: "Menu › Principal › Analítico",
    icon: <TrendingUp className="h-4 w-4" />,
    screen: "dashboard",
    resumo: "Os números da rede em gráficos e indicadores, para comparar lojas e acompanhar o caixa.",
    temNaTela: [
      "Filtros de ano, mês, dia, marca, unidade, status operacional e estado (UF).",
      "Pressão de caixa por vencimento: contas vencidas, que vencem nos próximos 7 dias e as que estão no prazo ou pagas.",
      "Indicadores: faturamento bruto, média por unidade, royalties, fundo de propaganda, lucro líquido, CMV, despesas operacionais e total faturado à matriz.",
      "Gráfico de faturamento por unidade, com opção de ligar/desligar os rótulos, ampliar e exportar CSV.",
    ],
    comoUsar: [
      "Ajuste os filtros para o período e as lojas que quer analisar.",
      "Use Consolidado da Rede para ver tudo junto, ou Abrir KPIs da Loja para ver vendas, margem e ticket médio de uma loja só.",
      "Clique em Abrir contas a pagar → para ir direto às contas vencidas.",
      "Clique em Ver DRE Completo para abrir o demonstrativo do mesmo recorte.",
      "Use Exportar CSV para levar os números para uma planilha.",
    ],
  },
  {
    id: "rotinas",
    grupo: "Pagamentos e Despesas",
    titulo: "Rotinas (contas a pagar)",
    onde: "Menu › Financeiro › Pagamentos e Despesas › aba Rotinas",
    icon: <CreditCard className="h-4 w-4" />,
    screen: "rp",
    resumo: "Agenda das contas da loja: aluguel, luz, internet, salários, royalties, fornecedores e outras.",
    temNaTela: [
      "Três cartões: Vencidas, A vencer (próximos 7 dias) e No prazo.",
      "Formulário Agendar Nova Conta: descrição, valor, vencimento, categoria, forma de pagamento e recorrência mensal.",
      "Lista de compromissos com semáforo (vencida, próxima, no prazo, paga) e filtros por status, período e categoria.",
      "Botão Exportar Excel.",
    ],
    comoUsar: [
      "Preencha descrição, valor e data de vencimento e escolha a categoria e a forma de pagamento.",
      "Em Recorrência mensal, escolha quantos meses a conta se repete (ex.: aluguel por 12 meses) e clique no botão de gerar.",
      "Quando pagar uma conta, clique no status dela na lista para registrar a baixa.",
      "Para mudar valor ou data, clique em Editar na linha.",
    ],
    dicas: ["Ao importar o extrato na Conciliação Bancária, o sistema tenta dar baixa sozinho nas contas abertas que batem com o extrato."],
  },
  {
    id: "conciliacao",
    grupo: "Pagamentos e Despesas",
    titulo: "Conciliação Bancária",
    onde: "Menu › Financeiro › Pagamentos e Despesas › aba Conciliação Bancária (também pelo botão Importar base)",
    icon: <CreditCard className="h-4 w-4" />,
    screen: "conciliation",
    resumo: "Onde você importa o extrato do banco e confere se cada movimento bate com o que está no sistema.",
    temNaTela: [
      "Cartões: movimentações lidas, correspondências, para revisar e despesas que foram para o DRE.",
      "Área para arrastar o arquivo do extrato (Excel, CSV, PDF, OFX, TXT ou Word com OFX) e escolher a unidade de destino.",
      "Baixas automáticas por recorrência: Varredura de Recorrências e + Nova Recorrência.",
      "Lista de movimentações com as abas Pendentes, Conciliados, Entre empresas e Todos.",
    ],
    comoUsar: [
      "Escolha em Destino dos lançamentos a unidade dona daquele extrato.",
      "Arraste o arquivo ou clique em Selecionar base. Nada é gravado antes da sua confirmação.",
      "Na aba Pendentes, marque as linhas corretas e clique em Aprovar Selecionados. Use Remover Selecionados para descartar as erradas.",
      "Se o movimento foi dinheiro passando de uma empresa sua para outra, selecione e clique em Registrar como entre empresas: assim não conta como receita nem despesa.",
      "Clique em Ver em Lançamentos para conferir o que entrou.",
    ],
    dicas: ["Para Word antigo (.doc), salve antes como .docx."],
  },
  {
    id: "lancamentos",
    grupo: "Pagamentos e Despesas",
    titulo: "Lançamentos",
    onde: "Menu › Financeiro › Pagamentos e Despesas › aba Lançamentos",
    icon: <CreditCard className="h-4 w-4" />,
    screen: "lancamentos",
    resumo: "Registro manual de entradas (vendas, recebimentos) e despesas. Tudo que entra aqui alimenta o DRE.",
    temNaTela: [
      "Cartões: entradas, despesas, saldo líquido e total de registros.",
      "Formulário Novo Lançamento: Entrada ou Despesa, data, valor, descrição, forma de pagamento, recorrência e observações.",
      "Histórico de Lançamentos com filtros por empresa, tipo, ano, mês e dia, e o botão Baixar PDF.",
    ],
    comoUsar: [
      "Escolha Entrada ou Despesa.",
      "Preencha data, valor e descrição e escolha a forma de pagamento.",
      "Se repete todo mês, escolha 3, 6 ou 12 meses. Se não, deixe Único.",
      "Clique em Salvar Lançamento.",
      "Para corrigir, encontre a linha no histórico e clique em Editar.",
    ],
    dicas: ["Os pagamentos de VT (passagens e cada corrida de Uber/extra) também aparecem aqui automaticamente."],
  },
  {
    id: "vt",
    grupo: "Pagamentos e Despesas",
    titulo: "VT (Vale-Transporte)",
    onde: "Menu › Financeiro › Pagamentos e Despesas › aba VT",
    icon: <CreditCard className="h-4 w-4" />,
    screen: "vt",
    resumo: "Calcula, paga e gera recibo do vale-transporte de cada colaborador, incluindo Uber, 99, táxi e outras corridas pagas pela empresa.",
    temNaTela: [
      "Mês de referência com os dias úteis, e os cartões Pago no mês, Falta pagar, Custo da loja (subsídio) e Desconto em folha (até 6%).",
      "Filtros: Todos, A pagar, Pagos em parte e Quitados.",
      "Botões Recalcular dias, Recarga (arquivo para pedir a recarga na operadora) e Folha (resumo dos descontos para a contabilidade).",
      "Uma linha por colaborador com dias, faltas (− e +), valor, botão Uber / extra, Pagar, Histórico e recibos, e Editar.",
    ],
    comoUsar: [
      "Cadastre antes a pessoa em Funcionários, dentro da loja certa, marcando que recebe VT. Ela aparece aqui sozinha.",
      "Clique em Editar para informar os transportes (ônibus, metrô, etc.), tarifas e a escala de trabalho.",
      "Lance as faltas com os botões − e + na linha. Cada falta tira um dia de VT.",
      "Uber ou outra corrida paga pela empresa: clique em Uber / extra (ou em Lançar corrida dentro de Editar), informe data, tipo, trajeto, valor e motivo e salve.",
      "Clique em Pagar. A tela mostra as passagens e as corridas ainda não pagas até a data do pagamento. Confirme.",
      "Abra Histórico e recibos e clique em Ver / Imprimir Recibo para gerar o PDF. O recibo lista as passagens e cada corrida extra.",
    ],
    dicas: [
      "Corrida já paga fica marcada como Pago em e não volta nos próximos pagamentos. Corrida não paga continua como A pagar.",
      "Cada corrida vira uma linha própria no extrato (Lançamentos), com a data da corrida.",
      "Se um pagamento foi feito errado, use Excluir lançamento no histórico: as corridas daquele pagamento voltam para A pagar.",
      "Pela lei, o desconto do VT no salário é de no máximo 6% do salário base. O que passar disso a empresa paga.",
    ],
  },
  {
    id: "dre",
    grupo: "Pagamentos e Despesas",
    titulo: "DRE",
    onde: "Menu › Financeiro › Pagamentos e Despesas › aba DRE",
    icon: <CreditCard className="h-4 w-4" />,
    screen: "dre",
    resumo: "O Demonstrativo do Resultado: receita, custos, despesas e lucro, montado a partir dos lançamentos reais.",
    temNaTela: [
      "Filtros de ano, mês, dia, marca e unidade.",
      "Cartões: receita bruta, lucro bruto operacional, despesas operacionais fixas e lucro líquido final.",
      "Leitura gerencial: margem líquida, despesas sobre receita e contas vencidas e próximas.",
      "A tabela oficial do DRE, conta por conta.",
    ],
    comoUsar: [
      "Escolha o período e as unidades.",
      "Confira a tabela e a margem líquida.",
      "Use Baixar Tabela DRE (.csv), Baixar PDF da Planilha ou Imprimir para enviar ao contador ou ao sócio.",
    ],
    dicas: ["Se um número parecer errado, a origem está em Lançamentos ou na Conciliação Bancária."],
  },
  {
    id: "taxas",
    grupo: "Financeiro",
    titulo: "Taxas e Recebimentos",
    onde: "Menu › Financeiro › Taxas e Recebimentos",
    icon: <Percent className="h-4 w-4" />,
    screen: "fees",
    resumo: "Taxas e prazos de cada meio de pagamento (dinheiro, PIX, débito, crédito, vale-refeição, TED) e simulador do valor líquido.",
    temNaTela: [
      "Tabela de meios de pagamento com taxa (%), prazo em dias úteis, horário de corte e previsão de recebimento.",
      "Simulador de venda: valor bruto, meio de pagamento, desconto e parcelas, mostrando o líquido e a data de liquidação.",
      "Limites e políticas comerciais: desconto máximo, ticket mínimo e antecipação automática.",
    ],
    comoUsar: [
      "Preencha a taxa e o prazo que sua maquininha ou banco cobra em cada meio.",
      "Clique em Salvar Regras.",
      "No simulador, digite um valor de venda para ver quanto cai na conta e quando.",
    ],
  },
  {
    id: "rede",
    grupo: "Rede",
    titulo: "Rede e Unidades",
    onde: "Menu › Rede › Rede e Unidades",
    icon: <Building2 className="h-4 w-4" />,
    screen: "network",
    resumo: "Visão de todas as lojas: quantas são, quanto faturam, o lucro de cada uma e quais precisam de atenção.",
    temNaTela: [
      "Cartões: unidades na rede, faturamento do mês, lucro líquido consolidado e margem da rede.",
      "Mapa das lojas e o gráfico Faturamento x Lucro por unidade.",
      "Saúde da rede e alertas (unidades saudáveis e em atenção).",
      "Um cartão por loja com responsável, cidade, faturamento, lucro, margem e o botão Ver DRE.",
    ],
    comoUsar: [
      "Use Cadastrar Novo Franqueado para abrir uma loja nova.",
      "Clique em Ver DRE no cartão de uma loja para ver o resultado só dela.",
      "Use Atualizar se outra pessoa acabou de mudar algo.",
    ],
  },
  {
    id: "produtos",
    grupo: "Rede",
    titulo: "Fornecedores e Produtos",
    onde: "Menu › Rede › Fornecedores e Produtos",
    icon: <PackageCheck className="h-4 w-4" />,
    screen: "produtos",
    resumo: "Catálogo de consulta com os produtos aprovados pela franqueadora e de quem comprar.",
    temNaTela: [
      "Totais: produtos homologados, fornecedores e produtos ativos.",
      "Abas Produtos e Fornecedores, com filtros por categoria e status (Ativo, Inativo, Pendente).",
    ],
    comoUsar: [
      "Escolha a aba Produtos ou Fornecedores.",
      "Filtre pela categoria para achar o item e veja o fornecedor e o código.",
      "Para cadastrar ou alterar, a matriz usa Configurações › Cadastro de Fornecedores e Produtos.",
    ],
  },
  {
    id: "funcionarios",
    grupo: "Gestão",
    titulo: "Funcionários",
    onde: "Menu › Gestão › Funcionários",
    icon: <Users className="h-4 w-4" />,
    screen: "employees",
    resumo: "Cadastro das pessoas de cada loja: cargo, matrícula, contato, PIX, salário e situação.",
    temNaTela: [
      "Busca por nome, cargo, matrícula ou unidade.",
      "Um cartão por colaborador com cargo, matrícula, loja, e-mail, telefone, chave PIX, salário e status (Ativo/Inativo).",
      "Botão Novo funcionário.",
    ],
    comoUsar: [
      "Clique em Novo funcionário.",
      "Preencha nome, cargo e escolha a Unidade (obrigatória). Complete salário, forma de pagamento e chave PIX.",
      "Marque Recebe vale-transporte se for o caso: a pessoa aparece na aba VT da unidade.",
      "Se a pessoa vai usar o sistema, preencha Login, Senha inicial e Nível de uso (Operador ou Franqueado).",
      "Clique em Salvar funcionário. Para alterar ou desativar, clique no lápis do cartão.",
    ],
  },
  {
    id: "acessos",
    grupo: "Gestão",
    titulo: "Acessos e Logins",
    onde: "Menu › Gestão › Acessos e Logins",
    icon: <KeyRound className="h-4 w-4" />,
    screen: "users",
    resumo: "Crie o login de cada pessoa, diga em qual loja ela trabalha e o que ela pode fazer.",
    temNaTela: [
      "Totais: unidades no seu alcance, acessos visíveis e ativos.",
      "Lista de credenciais com pessoa, login, nível de uso, loja e status, com Editar e Bloquear.",
    ],
    comoUsar: [
      "Clique em Novo acesso.",
      "Informe nome, login e senha, escolha o nível de uso e a loja.",
      "Salve e passe o login para a pessoa.",
      "Para trocar a senha, clique em Editar e digite uma nova. Para tirar o acesso, clique em Bloquear.",
    ],
    dicas: ["As senhas não aparecem depois de salvas, por segurança."],
  },
  {
    id: "config-preferencias",
    grupo: "Configurações",
    titulo: "Configurações › Preferências Gerais",
    onde: "Menu › Gestão › Configurações › Preferências Gerais",
    icon: <Settings className="h-4 w-4" />,
    screen: "configuracao",
    soMatriz: true,
    resumo: "Nome do sistema, razão social da franqueadora, moeda e tema visual.",
    temNaTela: [
      "Identidade da empresa: nome da aplicação, razão social, moeda padrão e tema (claro, escuro ou automático).",
      "Zona de manutenção: Apagar dados operacionais.",
    ],
    comoUsar: ["Altere os campos e clique em Salvar Preferências."],
    dicas: ["Apagar dados operacionais remove os dados da rede (lançamentos, contas, etc.). Usuários, regras, preferências e auditoria ficam. Use só se tiver certeza."],
  },
  {
    id: "config-marcas",
    grupo: "Configurações",
    titulo: "Configurações › Modelos & Marcas",
    onde: "Menu › Gestão › Configurações › Modelos & Marcas",
    icon: <Settings className="h-4 w-4" />,
    screen: "configuracao",
    soMatriz: true,
    resumo: "As marcas ou modelos de negócio da rede. Toda loja pertence a uma marca.",
    temNaTela: ["Um cartão por marca com a quantidade de lojas e o royalty padrão, com Editar e Excluir."],
    comoUsar: [
      "Clique em Cadastrar Novo Modelo / Marca, informe o nome e o royalty padrão e salve.",
      "Depois cadastre as lojas dessa marca em Cadastro de Franqueados.",
    ],
  },
  {
    id: "config-regras",
    grupo: "Configurações",
    titulo: "Configurações › Regras do Sistema",
    onde: "Menu › Gestão › Configurações › Regras do Sistema",
    icon: <Settings className="h-4 w-4" />,
    screen: "configuracao",
    soMatriz: true,
    resumo: "Valores padrão usados nos cálculos: imposto, CMV, royalty médio, desconto máximo, horário de corte bancário e sincronização.",
    temNaTela: ["Regras separadas por categoria (Geral, Regras de Negócio, Segurança, Operação), cada uma com seu botão Salvar."],
    comoUsar: [
      "Escolha a categoria.",
      "Mude o valor e clique em Salvar na regra, ou em Salvar Todos da Categoria.",
    ],
  },
  {
    id: "config-transferencias",
    grupo: "Configurações",
    titulo: "Configurações › Transferências entre Empresas",
    onde: "Menu › Gestão › Configurações › Transferências entre Empresas",
    icon: <Settings className="h-4 w-4" />,
    screen: "configuracao",
    soMatriz: true,
    resumo: "Regras para reconhecer dinheiro que só passou de uma empresa sua para outra, para não contar como receita nem despesa.",
    temNaTela: ["Formulário de regra com nome, palavras que aparecem no extrato (um termo por linha) e alcance: toda a rede, uma marca ou uma unidade.", "Lista das regras já criadas."],
    comoUsar: [
      "Crie uma regra com as palavras que aparecem no extrato nessas transferências (ex.: TED para a matriz).",
      "Escolha se vale para toda a rede, uma marca ou uma unidade e salve.",
      "Na Conciliação Bancária, os movimentos que baterem com a regra ficam fora do DRE e vão para a aba Entre empresas.",
    ],
  },
  {
    id: "config-dre",
    grupo: "Configurações",
    titulo: "Configurações › Parâmetros do DRE",
    onde: "Menu › Gestão › Configurações › Parâmetros do DRE",
    icon: <Settings className="h-4 w-4" />,
    screen: "configuracao",
    soMatriz: true,
    resumo: "Percentuais de imposto, CMV, taxas e despesas usados quando falta dado real, para a rede ou para cada loja.",
    temNaTela: [
      "Seletor: Padrão da Franqueadora (Rede) ou uma unidade.",
      "Alíquotas gerais e despesas operacionais (folha, VT, aluguel, energia, água, internet, royalties e outros).",
      "Prévia do DRE em tempo real sobre R$ 100.000.",
    ],
    comoUsar: [
      "Escolha a rede ou a unidade.",
      "Ajuste os percentuais olhando a prévia.",
      "Clique em Salvar Parâmetros ou em Aplicar ao DRE desta Unidade. Restaurar Padrão desfaz.",
    ],
  },
  {
    id: "config-permissoes",
    grupo: "Configurações",
    titulo: "Configurações › Permissões & Acessos",
    onde: "Menu › Gestão › Configurações › Permissões & Acessos",
    icon: <Settings className="h-4 w-4" />,
    screen: "configuracao",
    soMatriz: true,
    resumo: "Visão de todos os logins e da tabela do que cada perfil pode ver e alterar.",
    temNaTela: [
      "Os perfis: Dono da rede, Equipe matriz, Administrador de negócio, Franqueado e Operador local.",
      "Lista de usuários com nível, escopo e status.",
      "Matriz de controle de acesso por perfil.",
    ],
    comoUsar: ["Clique em Criar novo acesso para um login novo, ou em Bloquear para suspender alguém."],
  },
  {
    id: "config-royalties",
    grupo: "Configurações",
    titulo: "Configurações › Royalties por Marca",
    onde: "Menu › Gestão › Configurações › Royalties por Marca",
    icon: <Settings className="h-4 w-4" />,
    screen: "configuracao",
    soMatriz: true,
    resumo: "O percentual de royalty cobrado sobre o faturamento de cada marca. Só o Dono da rede altera.",
    temNaTela: ["Um cartão por marca com o percentual editável e a simulação para R$ 50 mil de faturamento."],
    comoUsar: [
      "Digite o novo percentual na marca.",
      "Clique em Salvar Taxas. O DRE e as apurações passam a usar o novo valor.",
    ],
  },
  {
    id: "config-fornecedores",
    grupo: "Configurações",
    titulo: "Configurações › Cadastro de Fornecedores e Produtos",
    onde: "Menu › Gestão › Configurações › Cadastro de Fornecedores e Produtos",
    icon: <Settings className="h-4 w-4" />,
    screen: "configuracao",
    soMatriz: true,
    resumo: "Onde a matriz cadastra e altera os produtos homologados e os fornecedores oficiais.",
    temNaTela: ["Abas Produtos Homologados e Fornecedores Homologados, com a tabela de cada um."],
    comoUsar: [
      "Escolha a aba.",
      "Clique em Cadastrar Novo Produto, preencha e salve.",
      "O que for cadastrado aparece para todos em Fornecedores e Produtos.",
    ],
  },
  {
    id: "config-franqueados",
    grupo: "Configurações",
    titulo: "Configurações › Cadastro de Franqueados",
    onde: "Menu › Gestão › Configurações › Cadastro de Franqueados",
    icon: <Settings className="h-4 w-4" />,
    screen: "configuracao",
    soMatriz: true,
    resumo: "Cadastro das lojas: marca, código, responsável, cidade e faturamento.",
    temNaTela: ["Filtros Todas, Ativas e Inativas e um cartão por loja com o botão Alterar."],
    comoUsar: [
      "Clique em Cadastrar Novo Franqueado, escolha a marca e preencha código, nome, responsável e cidade.",
      "Para mudar dados ou desativar uma loja, clique em Alterar.",
    ],
  },
  {
    id: "config-auditoria",
    grupo: "Configurações",
    titulo: "Configurações › Auditoria & Logs",
    onde: "Menu › Gestão › Configurações › Auditoria & Logs",
    icon: <Settings className="h-4 w-4" />,
    screen: "configuracao",
    soMatriz: true,
    resumo: "Histórico de quem mudou o quê e quando no sistema.",
    temNaTela: ["Lista em ordem de data de todas as alterações registradas."],
    comoUsar: ["Abra a aba e procure a alteração pela data ou pela pessoa."],
  },
];

const PRIMEIROS_PASSOS: { titulo: string; texto: string; screen: ScreenType; botao: string }[] = [
  { titulo: "Cadastre as marcas", texto: "Em Configurações › Modelos & Marcas, crie cada marca da rede com o royalty padrão.", screen: "configuracao", botao: "Abrir Configurações" },
  { titulo: "Cadastre as lojas", texto: "Em Rede e Unidades (ou Configurações › Cadastro de Franqueados), crie cada loja ligada à marca dela.", screen: "network", botao: "Abrir Rede e Unidades" },
  { titulo: "Crie os logins", texto: "Em Acessos e Logins, crie um acesso para cada pessoa e escolha a loja e o nível dela.", screen: "users", botao: "Abrir Acessos e Logins" },
  { titulo: "Cadastre os funcionários", texto: "Em Funcionários, escolha a loja no menu lateral e cadastre a equipe. Marque quem recebe VT.", screen: "employees", botao: "Abrir Funcionários" },
  { titulo: "Agende as contas fixas", texto: "Em Pagamentos e Despesas › Rotinas, cadastre aluguel, luz, internet e outras contas com recorrência.", screen: "rp", botao: "Abrir Rotinas" },
  { titulo: "Lance o dia a dia", texto: "Importe o extrato na Conciliação Bancária ou lance entradas e despesas em Lançamentos.", screen: "conciliation", botao: "Abrir Conciliação" },
  { titulo: "Pague o VT", texto: "Na aba VT, confira faltas e corridas extras, clique em Pagar e imprima o recibo.", screen: "vt", botao: "Abrir VT" },
  { titulo: "Acompanhe o resultado", texto: "Veja o DRE, o Analítico e o Início para saber como cada loja está.", screen: "dre", botao: "Abrir DRE" },
];

const PERFIS = [
  { nome: "Dono da rede", ve: "Toda a rede", faz: "Tudo, inclusive Configurações e royalties." },
  { nome: "Equipe matriz", ve: "Toda a rede", faz: "Gestão financeira e operacional de todas as lojas." },
  { nome: "Administrador de negócio", ve: "Lojas da sua marca", faz: "Opera e consulta as unidades da marca dele." },
  { nome: "Franqueado", ve: "Só a própria loja", faz: "Início, Analítico, Pagamentos e Despesas, Taxas, Rede, Produtos, Funcionários e Acessos da loja dele." },
  { nome: "Operador local", ve: "Só a própria loja", faz: "Uso básico do dia a dia da loja." },
];

const FAQ = [
  { p: "Escolho a loja onde?", r: "No menu lateral, nos seletores Franquia e Franqueado. Tudo o que você vê e cadastra passa a ser daquela loja. Para ver a rede inteira, escolha Todas as unidades." },
  { p: "Salvei e não apareceu. E agora?", r: "Confira se a loja escolhida no menu lateral é a certa. Depois clique em Atualizar ou recarregue a página. Os dados ficam salvos na nuvem e aparecem em qualquer aparelho." },
  { p: "O colaborador não aparece no VT.", r: "O VT usa o cadastro de Funcionários. Cadastre a pessoa dentro da loja certa e marque que ela recebe vale-transporte." },
  { p: "Como lanço um Uber que a empresa pagou?", r: "Na aba VT, clique em Uber / extra na linha da pessoa, informe a data, o valor e o motivo e salve. Ele entra no próximo pagamento, no recibo e no extrato." },
  { p: "Paguei o VT errado. Como desfaço?", r: "Abra Histórico e recibos na linha da pessoa e use Excluir lançamento. As corridas daquele pagamento voltam a ficar A pagar." },
  { p: "Como mando o DRE para o contador?", r: "Na aba DRE, escolha o período e clique em Baixar Tabela DRE (.csv), Baixar PDF da Planilha ou Imprimir." },
  { p: "Transferi dinheiro de uma empresa minha para outra. Vai contar como despesa?", r: "Não, se você marcar. Na Conciliação Bancária, selecione as linhas e clique em Registrar como entre empresas." },
  { p: "Esqueceram a senha.", r: "Em Acessos e Logins, clique em Editar no acesso da pessoa e cadastre uma nova senha." },
  { p: "Funciona no celular?", r: "Sim. No celular, o menu abre pelo botão de menu no topo da tela." },
];

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const InstrucoesScreen: React.FC<InstrucoesScreenProps> = ({ userSession, onNavigate }) => {
  const [aba, setAba] = useState<"comece" | "paginas" | "perfis" | "faq">("comece");
  const [busca, setBusca] = useState("");

  const isFranchisee = userSession?.profile === "franqueado" || userSession?.profile === "operador";

  const paginasVisiveis = useMemo(
    () => PAGINAS.filter((p) => !(isFranchisee && p.soMatriz)),
    [isFranchisee]
  );

  const termo = norm(busca.trim());
  const buscando = termo.length > 1;

  const paginasFiltradas = useMemo(() => {
    if (!buscando) return paginasVisiveis;
    return paginasVisiveis.filter((p) =>
      norm([p.titulo, p.onde, p.resumo, PARA_QUE_SERVE[p.id] || "", ...p.temNaTela, ...p.comoUsar, ...(p.dicas || []), ...(BOTOES[p.id] || []).map((x) => x.b + " " + x.faz)].join(" ")).includes(termo)
    );
  }, [paginasVisiveis, buscando, termo]);

  const faqFiltrado = useMemo(
    () => (buscando ? FAQ.filter((f) => norm(f.p + " " + f.r).includes(termo)) : FAQ),
    [buscando, termo]
  );

  const grupos = useMemo(() => {
    const out: { grupo: string; itens: Pagina[] }[] = [];
    paginasFiltradas.forEach((p) => {
      const g = out.find((x) => x.grupo === p.grupo);
      if (g) g.itens.push(p);
      else out.push({ grupo: p.grupo, itens: [p] });
    });
    return out;
  }, [paginasFiltradas]);

  const irPara = (id: string) => {
    const el = document.getElementById(`manual-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const abas = [
    { id: "comece", label: "Comece aqui", icon: <Rocket className="h-4 w-4" /> },
    { id: "paginas", label: "Página por página", icon: <BookOpen className="h-4 w-4" /> },
    { id: "perfis", label: "Perfis e acessos", icon: <Shield className="h-4 w-4" /> },
    { id: "faq", label: "Dúvidas frequentes", icon: <HelpCircle className="h-4 w-4" /> },
  ] as const;

  const abaAtual = buscando ? "busca" : aba;

  const renderPagina = (p: Pagina) => (
    <article
      key={p.id}
      id={`manual-${p.id}`}
      className="scroll-mt-4 rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-base font-extrabold text-[#0f172a]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eff6ff] text-[#2563eb]">{p.icon}</span>
            {p.titulo}
            {p.soMatriz && (
              <span className="rounded-full border border-[#fde68a] bg-[#fffbeb] px-2 py-0.5 text-[10px] font-bold text-[#92400e]">Só matriz</span>
            )}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#64748b]">
            <MapPin className="h-3 w-3" /> {p.onde}
          </p>
        </div>
        {p.screen && (
          <button
            type="button"
            onClick={() => onNavigate(p.screen!)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3 py-2 text-xs font-bold text-white hover:bg-[#1d4ed8] cursor-pointer"
          >
            Abrir esta página <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <p className="mt-3 text-sm text-[#334155]">{p.resumo}</p>

      {PARA_QUE_SERVE[p.id] && (
        <div className="mt-3 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] p-3">
          <p className="mb-1 flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#1d4ed8]">
            <Target className="h-3.5 w-3.5" /> Para que serve esta página
          </p>
          <p className="text-sm text-[#1e3a8a]">{PARA_QUE_SERVE[p.id]}</p>
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-[#64748b]">O que tem na tela</h4>
          <ul className="space-y-1.5 text-sm text-[#334155]">
            {p.temNaTela.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#94a3b8]" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#64748b]">
            <ListChecks className="h-3.5 w-3.5" /> Como usar
          </h4>
          <ol className="space-y-1.5 text-sm text-[#334155]">
            {p.comoUsar.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[11px] font-bold text-[#2563eb]">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {(BOTOES[p.id] || []).length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#64748b]">
            <MousePointerClick className="h-3.5 w-3.5" /> O que cada botão faz
          </h4>
          <dl className="divide-y divide-[#f1f5f9] rounded-xl border border-[#e2e8f0]">
            {BOTOES[p.id].map((x) => (
              <div key={x.b} className="grid gap-1 px-3 py-2.5 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-4">
                <dt>
                  <span className="inline-block rounded-md border border-[#cbd5e1] bg-[#f8fafc] px-2 py-0.5 text-xs font-bold text-[#0f172a]">{x.b}</span>
                </dt>
                <dd className="text-sm text-[#334155]">{x.faz}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {p.dicas && p.dicas.length > 0 && (
        <div className="mt-4 rounded-xl border border-[#fde68a] bg-[#fffbeb] p-3">
          <p className="mb-1 flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#92400e]">
            <Lightbulb className="h-3.5 w-3.5" /> Dicas
          </p>
          <ul className="space-y-1 text-sm text-[#78350f]">
            {p.dicas.map((d, i) => (
              <li key={i}>• {d}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-1">
      {/* Cabeçalho */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-[#0f172a]">
              <BookOpen className="h-5 w-5 text-[#2563eb]" /> Manual de uso
            </h2>
            <p className="mt-1 text-sm text-[#64748b]">
              O que tem em cada página do sistema e como usar, passo a passo.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              id="manual-busca"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar no manual (ex.: Uber, recibo, senha)"
              aria-label="Buscar no manual"
              className="w-full rounded-lg border border-[#cbd5e1] bg-white py-2 pl-9 pr-8 text-sm text-[#0f172a] focus:border-[#2563eb] focus:outline-none"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                aria-label="Limpar busca"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#94a3b8] hover:text-[#0f172a] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {!buscando && (
          <div className="mt-4 flex flex-wrap gap-2" role="tablist">
            {abas.map((a) => (
              <button
                key={a.id}
                type="button"
                role="tab"
                aria-selected={aba === a.id}
                onClick={() => setAba(a.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer ${
                  aba === a.id
                    ? "bg-[#2563eb] text-white"
                    : "border border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f1f5f9]"
                }`}
              >
                {a.icon} {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Busca */}
      {abaAtual === "busca" && (
        <div className="space-y-4">
          <p className="text-sm text-[#64748b]">
            {paginasFiltradas.length + faqFiltrado.length === 0
              ? `Nada encontrado para "${busca}". Tente outra palavra.`
              : `${paginasFiltradas.length} página(s) e ${faqFiltrado.length} dúvida(s) encontradas para "${busca}".`}
          </p>
          {paginasFiltradas.map(renderPagina)}
          {faqFiltrado.length > 0 && (
            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-base font-extrabold text-[#0f172a]">Dúvidas frequentes</h3>
              <dl className="space-y-3">
                {faqFiltrado.map((f) => (
                  <div key={f.p}>
                    <dt className="text-sm font-bold text-[#0f172a]">{f.p}</dt>
                    <dd className="text-sm text-[#475569]">{f.r}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      )}

      {/* Comece aqui */}
      {abaAtual === "comece" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
            <h3 className="text-base font-extrabold text-[#0f172a]">Como o sistema funciona</h3>
            <ul className="mt-3 space-y-2 text-sm text-[#334155]">
              <li>• <strong>Menu lateral:</strong> todas as páginas ficam ali, em grupos (Principal, Financeiro, Rede e Gestão). No celular, ele abre pelo botão de menu no topo.</li>
              <li>• <strong>Escolha da loja:</strong> os seletores Franquia e Franqueado, no menu lateral, decidem de qual loja são os dados que você vê e cadastra.</li>
              <li>• <strong>Salvamento:</strong> o que você salva vai para a nuvem e aparece em qualquer computador ou celular.</li>
              <li>• <strong>Ajuda:</strong> este manual abre pelo botão Manual, no topo da tela, ou por Manual de uso, no menu lateral.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
            <h3 className="text-base font-extrabold text-[#0f172a]">Primeiros passos, na ordem</h3>
            <ol className="mt-4 grid gap-3 md:grid-cols-2">
              {PRIMEIROS_PASSOS.filter((s) => !(isFranchisee && s.screen === "configuracao")).map((s, i) => (
                <li key={s.titulo} className="flex gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-xs font-bold text-white">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#0f172a]">{s.titulo}</p>
                    <p className="mt-0.5 text-sm text-[#475569]">{s.texto}</p>
                    <button
                      type="button"
                      onClick={() => onNavigate(s.screen)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#2563eb] hover:underline cursor-pointer"
                    >
                      {s.botao} <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
            <h3 className="text-base font-extrabold text-[#0f172a]">Mapa das páginas</h3>
            <p className="mt-1 text-sm text-[#64748b]">Clique numa página para ver o que tem nela e como usar.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {paginasVisiveis.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setAba("paginas");
                    setTimeout(() => irPara(p.id), 50);
                  }}
                  className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold text-[#334155] hover:border-[#2563eb] hover:text-[#2563eb] cursor-pointer"
                >
                  {p.titulo}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Página por página */}
      {abaAtual === "paginas" && (
        <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
          <nav className="hidden lg:block" aria-label="Índice do manual">
            <div className="sticky top-4 space-y-3 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
              {grupos.map((g) => (
                <div key={g.grupo}>
                  <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-[#7185a5]">{g.grupo}</p>
                  {g.itens.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => irPara(p.id)}
                      className="block w-full truncate rounded px-2 py-1 text-left text-xs font-semibold text-[#475569] hover:bg-[#f1f5f9] hover:text-[#2563eb] cursor-pointer"
                    >
                      {p.titulo.replace("Configurações › ", "")}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </nav>
          <div className="space-y-4">
            {grupos.map((g) => (
              <section key={g.grupo} className="space-y-4">
                <h2 className="pt-1 text-xs font-extrabold uppercase tracking-wider text-[#7185a5]">{g.grupo}</h2>
                {g.itens.map(renderPagina)}
              </section>
            ))}
          </div>
        </div>
      )}

      {/* Perfis */}
      {abaAtual === "perfis" && (
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
          <h3 className="text-base font-extrabold text-[#0f172a]">Quem vê o quê</h3>
          <p className="mt-1 text-sm text-[#64748b]">
            Cada login tem um nível e uma loja. A pessoa só vê e altera o que o nível dela permite.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-[11px] uppercase tracking-wider text-[#64748b]">
                  <th className="py-2 pr-4">Nível</th>
                  <th className="py-2 pr-4">Vê</th>
                  <th className="py-2">Pode fazer</th>
                </tr>
              </thead>
              <tbody>
                {PERFIS.map((p) => (
                  <tr key={p.nome} className="border-b border-[#f1f5f9] align-top">
                    <td className="py-2 pr-4 font-bold text-[#0f172a]">{p.nome}</td>
                    <td className="py-2 pr-4 text-[#334155]">{p.ve}</td>
                    <td className="py-2 text-[#334155]">{p.faz}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate("users")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3 py-2 text-xs font-bold text-white hover:bg-[#1d4ed8] cursor-pointer"
            >
              Criar ou editar logins <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* FAQ */}
      {abaAtual === "faq" && (
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
          <h3 className="text-base font-extrabold text-[#0f172a]">Dúvidas frequentes</h3>
          <dl className="mt-3 divide-y divide-[#f1f5f9]">
            {FAQ.map((f) => (
              <div key={f.p} className="py-3">
                <dt className="text-sm font-bold text-[#0f172a]">{f.p}</dt>
                <dd className="mt-0.5 text-sm text-[#475569]">{f.r}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
};

export default InstrucoesScreen;
