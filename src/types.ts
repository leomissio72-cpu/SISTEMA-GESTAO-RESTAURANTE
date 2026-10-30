export type ScreenType =
  | "home"
  | "network"
  | "map"
  | "dashboard"
  | "dre"
  | "dre_restaurante"
  | "fees"
  | "dreparams"
  | "lancamentos"
  | "conciliation"
  | "import_base"
  | "vt"
  | "rp"
  | "pagamentos_despesas"
  | "permissoes"
  | "tenants"
  | "employees"
  | "users"
  | "configuracao"
  | "settings"
  | "produtos"
  | "notas_fiscais"
  | "instrucoes";

export interface ConfigItem {
  key: string;
  name: string;
  value: string;
  type: "string" | "number" | "boolean" | "select";
  category: "Geral" | "Financeiro" | "Regras de Negócio" | "Sincronização" | "Segurança" | "Operação" | string;
  description: string;
  lastModified: string;
  modifiedBy: string;
  options?: string[];
}

export type CloudConfigItem = ConfigItem;

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  key: string;
  oldValue: any;
  newValue: any;
  user: string;
  ip?: string;
}

export interface Business {
  id: string;
  name: string;
  brand: string;
  color: string;
  royalty?: number;
  royaltyType?: "pct" | "fixed";
}

export interface FranchiseUnit {
  id: string;
  businessId: string;
  name: string;
  code: string;
  resp: string;
  address: string;
  city: string;
  state?: string;
  region: string;
  lat?: number;
  lng?: number;
  coordinatesVerified?: boolean;
  faturamento: number;
  pendencias: number;
  rpDone: number;
  status: "green" | "amber" | "red" | "yellow";
  /** Define se a unidade participa dos seletores e da operação atual. */
  active?: boolean;
  email?: string;
  phone?: string;
}

export interface DreExpenseDef {
  id: string;
  name: string;
  group: "pessoal" | "ocupacao" | "utilidades" | "franquia" | "operacional";
  pct: number;
  fromConciliation: boolean;
  icon: string;
}

export interface DreParams {
  impostos: number;
  cmv: number;
  fees: number;
  discount: number;
  despesas: Record<string, number>;
}

export interface DreExpenseItem extends DreExpenseDef {
  value: number;
}

export interface DreCalculation {
  fatBruta: number;
  desconto: number;
  receitaAjustada: number;
  impostos: number;
  receitaLiquida: number;
  cmv: number;
  taxasNegocio: number;
  lucroBruto: number;
  despesas: DreExpenseItem[];
  totalDesp: number;
  lucroLiquido: number;
  margemBruta: number;
  margemLiquida: number;
  despRatio: number;
  params: DreParams;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  fee: number;
  prazoDias: number;
  cutoffHour: number;
  parcelas: boolean;
  bandeira: string | null;
}

export interface BusinessRule {
  maxDiscount: number;
  minTicket: number;
  advance: boolean;
}

export interface ManualEntry {
  id: string;
  tenant: string;
  type: "entrada" | "despesa";
  date: string;
  value: number;
  desc: string;
  apelido?: string;
  catId: string;
  catName: string;
  pay: string;
  note?: string;
  sourceFile?: string;
  conciliationStatus?: "review" | "matched" | "rejected";
  /** Mantém a transferência no histórico, mas exclui seu valor do DRE/totais operacionais. */
  isIntercompany?: boolean;
  excludedFromDre?: boolean;
  intercompanyRuleId?: string;
  intercompanyReason?: string;
  counterpartyDocument?: string;
  sourceAccount?: string;
  destinationAccount?: string;
  created: string;
}

export type IntercompanyRuleScope = "rede" | "empresa" | "unidade";

export interface IntercompanyRule {
  id: string;
  name: string;
  active: boolean;
  scope: IntercompanyRuleScope;
  businessId?: string;
  tenantId?: string;
  /** Termos que devem aparecer na descrição/histórico do extrato. */
  terms: string[];
  /** CNPJ/CPF ou conta/PIX de contraparte, quando o arquivo trouxer esses dados. */
  counterpartyDocuments?: string[];
  counterpartyAccounts?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Employee {
  id: string;
  nome: string;
  matricula: string;
  cargo: string;
  unidade: string;
  email: string;
  vt: boolean;
  vtCidade?: string;
  vtConducoes?: Array<{ id: string; nome: string; quantidade: number; tarifa: number }>;
  login?: string;
  phone?: string;
  salary?: number;
  active?: boolean;
  cpf?: string;
  admissionDate?: string;
  paymentMethod?: string;
  bank?: string;
  pixKey?: string;
  notes?: string;
  accessProfile?: "operador" | "franqueado" | "admin" | "equipe" | "dono";
}

export interface UserAccount {
  id: string;
  nome: string;
  email: string;
  login: string;
  perfil: "dono" | "equipe" | "admin" | "franqueado" | "operador" | string;
  unidade: string;
  status: "ativo" | "inativo";
  last?: string;
  employeeId?: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: "admin" | "team" | "franchisee" | "dono" | "equipe" | "franqueado";
  tenantId?: string;
  unitName?: string;
  email?: string;
}

export interface UserSession {
  login: string;
  name: string;
  tenant: string;
  profile: "dono" | "equipe" | "admin" | "franqueado" | "operador";
  token?: string;
  expiresAt?: number;
}

export interface VTPaymentRecord {
  id: string;
  data: string;
  dias: number;
  valor: number;
  periodoRef: string;
  dataInicio?: string;
  dataFim?: string;
  metodo?: string;
  observacao?: string;
  descontoCltAbatido?: number;
  registradoPor?: string;
  /** Parte do valor que é das passagens normais (dias × diária). */
  valorPassagens?: number;
  /** Corridas extras (Uber, 99, táxi…) incluídas neste pagamento. */
  extras?: VTTransporteExtra[];
  valorExtras?: number;
}

export interface VTEmployeeItem {
  id: string;
  /** Funcionário do cadastro (aba Funcionários) a que este VT pertence. */
  employeeId?: string;
  nome: string;
  mat: string;
  setor: string;
  operadora: string;
  cartaoNumero?: string;
  tarifaIda: number;
  tarifaVolta: number;
  diasPrevistos: number;
  faltas: number;
  salarioBase: number;
  uberAdicional?: number;
  statusRecarga?: "pendente" | "processado" | "creditado" | "pago_pix";
  quantoJaFoiPagoNoMes?: number;
  diasPagosNoMes?: number;
  historicoPagamentos?: VTPaymentRecord[];
  /** Transportes usados no dia (ex.: 2 trens e 1 ônibus). Quando existe, substitui tarifaIda/tarifaVolta no cálculo. */
  trechos?: VTTrecho[];
  /** Como a pessoa recebe o VT. */
  formaPagamento?: "cartao" | "pix" | "deposito" | "dinheiro";
  pixTipo?: "cpf" | "celular" | "email" | "aleatoria";
  pixChave?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  tipoConta?: "corrente" | "poupanca";
  /** De quanto em quanto tempo o VT é pago a esta pessoa. */
  periodicidade?: "semanal" | "quinzenal" | "mensal";
  /** Dias da semana trabalhados (0 = domingo … 6 = sábado). */
  diasSemana?: number[];
  /** Quando verdadeiro, usa diasPrevistos digitado em vez de calcular pela escala. */
  diasManual?: boolean;
  /** Corridas pagas pela empresa fora do VT normal (ex.: Uber na volta para casa). Entram no VT do período da data. */
  transportesExtras?: VTTransporteExtra[];
}

export interface VTTransporteExtra {
  id: string;
  /** Data da corrida (AAAA-MM-DD). */
  data: string;
  tipo: "uber" | "99" | "taxi" | "onibus_extra" | "outro";
  trajeto: "volta" | "ida" | "ida_volta";
  valor: number;
  motivo?: string;
  registradoPor?: string;
  criadoEm?: string;
  /** Data em que a corrida foi paga (fica fora dos próximos pagamentos). */
  pagoEm?: string;
  /** Pagamento de VT que incluiu esta corrida. */
  pagamentoId?: string;
}

export interface VTTrecho {
  id: string;
  tipo: "onibus" | "trem" | "metro" | "brt" | "intermunicipal" | "van" | "barca" | "integracao" | "outro";
  tarifa: number;
  /** Quantas passagens desse transporte na ida. */
  ida: number;
  /** Quantas passagens desse transporte na volta. */
  volta: number;
}

export interface VTConfig {
  title: string;
  period: string;
  rate: number;
  days: number;
  format: "both" | "excel" | "pdf";
  prefix: string;
  pix: boolean;
  notes: boolean;
  tenant: string;
  periodoTipo?: "semanal" | "quinzenal" | "mensal";
  descontoCltPct?: number;
  diasUteisCalculados?: number;
  employees?: VTEmployeeItem[];
}

export interface BillItem {
  id: string;
  desc: string;
  apelido?: string;
  vencimento: string;
  value: number;
  cat: string;
  status: "open" | "paid";
  payMethod: string;
  /** Rede ou unidade à qual o compromisso pertence. */
  tenantId?: string;
  businessId?: string;
  createdAt?: string;
}

export interface SystemSettings {
  appName: string;
  companyName: string;
  cnpjMatriz: string;
  theme?: string;
  currency?: string;
  autoSync?: boolean;
  syncInterval?: number;
  contactEmail?: string;
}

export interface HomologatedProduct {
  id: string;
  name: string;
  category: string;
  supplierId: string;
  supplierName: string;
  sku?: string;
  brand?: string;
  unit?: string;
  status: "ativo" | "inativo" | "pendente" | string;
  notes?: string;
}

export interface RegisteredSupplier {
  id: string;
  name: string;
  tradeName?: string;
  document?: string;
  contact?: string;
  city?: string;
  businessId?: string;
  tenantId?: string;
  categories?: string[];
  status: "ativo" | "inativo" | "pendente" | string;
}

export interface RoutineRP {
  id: string;
  name: string;
  desc: string;
  sched: string;
  status: "done" | "sched" | "idle";
}

export interface ConciliationItem {
  entryId?: string;
  /** Linha lida de um arquivo e ainda não confirmada na base. */
  isImportPreview?: boolean;
  sourceFile?: string;
  date: string;
  desc: string;
  apelido?: string;
  value: string;
  numericValue: number;
  categoria: string;
  match: string;
  status: "match" | "review";
  label: string;
  tone: "green" | "amber" | "red";
  toDre?: boolean;
  isIntercompany?: boolean;
  intercompanyRuleId?: string;
  intercompanyReason?: string;
  counterpartyDocument?: string;
  sourceAccount?: string;
  destinationAccount?: string;
  previsao?: string;
}

export interface RoyaltyHistoryEntry {
  id: string;
  businessId: string;
  businessName?: string;
  date: string;
  type: "pct" | "fixed";
  value: number;
  user: string;
}

export interface NotaFiscalItem {
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  ncm?: string;
  cfop?: string;
  unidade?: string;
}

export interface NotaFiscal {
  id: string;
  chave: string;
  numero: string;
  serie: string;
  emitente: string;
  cnpjEmitente: string;
  dataEmissao: string;
  valor: number;
  status: "autorizada" | "cancelada" | "inutilizada" | "denegada";
  situacaoManifesto?: "ciencia" | "confirmada" | "desconhecida" | "naoRealizada";
  importada?: boolean;
  billId?: string;
  xmlRaw?: string;
  itens?: NotaFiscalItem[];
  naturezaOperacao?: string;
  chaveAcesso?: string;
  fonte?: "xml" | "receita" | "manual";
  createdAt: string;
}

export interface CertificadoDigital {
  id: string;
  nome: string;
  cnpj: string;
  validade: string;
  tipo: "A1" | "A3";
  ativo: boolean;
  uploadedAt: string;
  pfxBase64?: string;
}

export interface DreRestauranteParams {
  cmvPct: number;
  cmoPct: number;
  depreciacao: number;
  amortizacao: number;
  juros: number;
  impostoRenda: number;
}

export interface CloudState {
  version?: number;
  /** Quando o Dono apagou os dados operacionais (e a marca assinada pelo servidor). */
  operationalClearedAt?: string;
  operationalClearToken?: string;
  businesses: Business[];
  franchises: FranchiseUnit[];
  employees: Employee[];
  users: UserAccount[];
  manualEntries: ManualEntry[];
  /** Compromissos de contas a pagar persistidos. */
  bills?: BillItem[];
  configs: ConfigItem[];
  cloudConfigs?: ConfigItem[];
  auditLogs?: AuditLog[];
  dreParams: Record<string, DreParams>;
  paymentMethods: PaymentMethod[] | Record<string, PaymentMethod[]>;
  businessRules: BusinessRule | Record<string, BusinessRule>;
  royalties: Record<string, number>;
  matrizFunds?: Record<string, number>;
  royaltyHistory?: RoyaltyHistoryEntry[];
  permissions: Record<string, any>;
  vtConfigs: Record<string, VTConfig>;
  systemSettings: SystemSettings;
  products?: HomologatedProduct[];
  suppliers?: RegisteredSupplier[];
  intercompanyRules?: IntercompanyRule[];
  intercompanySeedVersion?: number;
  accessVault?: string;
  notasFiscais?: NotaFiscal[];
  certificados?: CertificadoDigital[];
  dreRestauranteParams?: DreRestauranteParams;
  lastUpdated: string;
}
