import React, { useState, useEffect, useRef, useMemo } from "react";
import { VTConfig, VTEmployeeItem, VTPaymentRecord, ScreenType, UserSession, ManualEntry, Employee } from "../../types";
import { formatBrl, formatBrl2, getBusinessDaysInMonth, getBusinessDaysRange } from "../../utils/calculations";
import {
  DEFAULT_SCHEDULE, PAYMENT_FORMS, PERIODICITIES, TRANSPORT_TYPES, WEEKDAYS,
  brDate, diariaFromTrechos, empDiaria, fortnightPeriod, idaVoltaFromTrechos, isoDate, monthPeriod, monthWorkDays,
  nextPeriod, paidInPeriod, parseIso, paymentDestination, paymentFormLabel, periodFor, trechosResumo, weekPeriod, workingDaysBetween,
  EXTRA_ROUTES, EXTRA_TRANSPORT_TYPES, extraRouteLabel, extraTransportLabel, extrasInPeriod, extrasTotal, pendingExtras, sumExtras, paidPassagensInPeriod,
  type Period,
} from "../../utils/vt";
import type { VTTrecho, VTTransporteExtra } from "../../types";
import {
  FileSpreadsheet,
  Save,
  Download,
  Printer,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Search,
  CreditCard,
  Building2,
  Users,
  AlertCircle,
  HelpCircle,
  Sliders,
  DollarSign,
  TrendingUp,
  X,
  Check,
  Calendar,
  History,
  FileCheck,
  Receipt,
  CalendarDays,
  ArrowRight,
  Info,
  Mail,
  UserPlus,
  Car
} from "lucide-react";

interface VtScreenProps {
  currentTenantId: string;
  vtConfigs: Record<string, VTConfig>;
  onSaveVtConfig: (tenantId: string, config: VTConfig) => Promise<void>;
  onNavigate: (screen: ScreenType) => void;
  userSession?: UserSession | null;
  manualEntries?: ManualEntry[];
  onCreateEntry?: (entry: Omit<ManualEntry, "id" | "created">) => Promise<void>;
  /** Cadastro de funcionários (aba Funcionários). O VT mostra só quem é desta unidade. */
  registeredEmployees?: Employee[];
  /** Nome da unidade para comprovantes e e-mails. */
  unitName?: string;
}

const normText = (value?: string) =>
  (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");

/** Adivinha o tipo da chave PIX pelo formato. */
const pixTypeOf = (key: string): VTEmployeeItem["pixTipo"] => {
  const k = key.trim();
  if (k.includes("@")) return "email";
  const digits = k.replace(/\D/g, "");
  if (/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(k)) return "cpf";
  if (digits.length >= 10 && digits.length <= 13) return "celular";
  return "aleatoria";
};

/** Converte o modo de pagamento do cadastro para a forma de pagamento do VT. */
const paymentFromRegistry = (method?: string): VTEmployeeItem["formaPagamento"] | undefined => {
  const m = normText(method);
  if (!m) return undefined;
  if (m.includes("pix")) return "pix";
  if (m.includes("transfer") || m.includes("conta") || m.includes("deposito")) return "deposito";
  if (m.includes("dinheiro")) return "dinheiro";
  return undefined;
};

const defaultEmployees: VTEmployeeItem[] = [
  {
    id: "vt_1",
    nome: "Renata Souza Martins",
    mat: "0012",
    setor: "Atendimento & Balcão",
    operadora: "Bilhete Único SP (SPTrans)",
    cartaoNumero: "9823.4412.0911",
    tarifaIda: 5.0,
    tarifaVolta: 5.0,
    diasPrevistos: 22,
    faltas: 0,
    salarioBase: 2100.0,
    uberAdicional: 0,
    statusRecarga: "creditado",
    quantoJaFoiPagoNoMes: 220.0,
    diasPagosNoMes: 22,
    historicoPagamentos: [
      {
        id: "vtp_init_1",
        data: new Date().toISOString().slice(0, 10),
        dias: 22,
        valor: 220.0,
        periodoRef: "Mês Cheio (22 dias úteis)",
        dataInicio: "01/10/2026",
        dataFim: "31/10/2026",
        metodo: "Cartão Recarga Ticket",
        observacao: "Carga mensal completa"
      }
    ]
  },
  {
    id: "vt_2",
    nome: "Carlos Eduardo Silveira",
    mat: "0018",
    setor: "Vendas & Caixa",
    operadora: "Cartão TOP Metropolitano",
    cartaoNumero: "7721.8902.1243",
    tarifaIda: 5.35,
    tarifaVolta: 5.35,
    diasPrevistos: 22,
    faltas: 1,
    salarioBase: 2450.0,
    uberAdicional: 0,
    statusRecarga: "processado",
    quantoJaFoiPagoNoMes: 112.35,
    diasPagosNoMes: 10,
    historicoPagamentos: [
      {
        id: "vtp_init_2",
        data: new Date().toISOString().slice(0, 10),
        dias: 10,
        valor: 112.35,
        periodoRef: "1ª Quinzena (10 dias úteis)",
        dataInicio: "01/10/2026",
        dataFim: "14/10/2026",
        metodo: "PIX",
        observacao: "Adiantamento 1ª quinzena"
      }
    ]
  },
  {
    id: "vt_3",
    nome: "Mariana Costa Santos",
    mat: "0021",
    setor: "Recepção & Suporte",
    operadora: "Bilhete Único SP (SPTrans)",
    cartaoNumero: "9823.1102.8765",
    tarifaIda: 5.0,
    tarifaVolta: 5.0,
    diasPrevistos: 22,
    faltas: 0,
    salarioBase: 1950.0,
    uberAdicional: 35.0,
    statusRecarga: "processado",
    quantoJaFoiPagoNoMes: 100.0,
    diasPagosNoMes: 10,
    historicoPagamentos: [
      {
        id: "vtp_init_3",
        data: new Date().toISOString().slice(0, 10),
        dias: 10,
        valor: 100.0,
        periodoRef: "Primeiros 10 dias úteis",
        metodo: "PIX",
        observacao: "Transferência bancária inicial"
      }
    ]
  },
  {
    id: "vt_4",
    nome: "Lucas Oliveira Nogueira",
    mat: "0026",
    setor: "Operação & Estoque",
    operadora: "RioCard Mais / Ônibus",
    cartaoNumero: "4412.9812.5532",
    tarifaIda: 4.8,
    tarifaVolta: 4.8,
    diasPrevistos: 26,
    faltas: 2,
    salarioBase: 1850.0,
    uberAdicional: 0,
    statusRecarga: "pendente",
    quantoJaFoiPagoNoMes: 0,
    diasPagosNoMes: 0,
    historicoPagamentos: []
  },
  {
    id: "vt_5",
    nome: "Beatriz Lima Rocha",
    mat: "0031",
    setor: "Supervisão Operacional",
    operadora: "Vale Combustível / Cartão Ticket",
    cartaoNumero: "6032.1902.4410",
    tarifaIda: 9.0,
    tarifaVolta: 9.0,
    diasPrevistos: 22,
    faltas: 0,
    salarioBase: 3600.0,
    uberAdicional: 0,
    statusRecarga: "pago_pix",
    quantoJaFoiPagoNoMes: 396.0,
    diasPagosNoMes: 22,
    historicoPagamentos: [
      {
        id: "vtp_init_5",
        data: new Date().toISOString().slice(0, 10),
        dias: 22,
        valor: 396.0,
        periodoRef: "Mês Completo via PIX (22 dias)",
        metodo: "PIX",
        observacao: "Crédito integral em conta para combustível"
      }
    ]
  }
];

export const VtScreen: React.FC<VtScreenProps> = ({
  currentTenantId,
  vtConfigs,
  onSaveVtConfig,
  onNavigate,
  userSession,
  manualEntries,
  onCreateEntry,
  registeredEmployees = [],
  unitName,
}) => {
  const unitLabel = unitName || currentTenantId;
  // Calculated business days in current month
  const businessDaysInfo = getBusinessDaysInMonth();

  const hasSavedConfig = Object.prototype.hasOwnProperty.call(vtConfigs, currentTenantId);
  const currentConfig: VTConfig = vtConfigs[currentTenantId] || {
    title: "Planilha VT Mensal - Benefício e Recarga",
    period: "Mês Vigente",
    rate: 10.0,
    days: businessDaysInfo.businessDays,
    format: "both",
    prefix: "VT_Folha",
    pix: true,
    notes: true,
    tenant: currentTenantId,
    periodoTipo: "mensal",
    descontoCltPct: 0.06,
    diasUteisCalculados: businessDaysInfo.businessDays,
    employees: [],
  };

  const [form, setForm] = useState<VTConfig>(currentConfig);
  const [employees, setEmployees] = useState<VTEmployeeItem[]>(
    currentConfig.employees ?? []
  );
  const [isSaved, setIsSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<VTEmployeeItem | null>(null);
  const [isBatchDaysModalOpen, setIsBatchDaysModalOpen] = useState(false);
  const [batchDaysValue, setBatchDaysValue] = useState(businessDaysInfo.businessDays);
  
  // Payment Launch & Receipt Modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedEmpForPayment, setSelectedEmpForPayment] = useState<VTEmployeeItem | null>(null);
  type PeriodTipo = Period["tipo"];
  const [paymentForm, setPaymentForm] = useState<{
    tipoPeriodo: PeriodTipo;
    dias: number;
    dataInicio: string;
    dataFim: string;
    valorCalculado: number;
    valorAjustado: number;
    metodo: string;
    observacao: string;
    lancarDespesa: boolean;
  }>({
    tipoPeriodo: "mes",
    dias: 0,
    dataInicio: isoDate(new Date()),
    dataFim: isoDate(new Date()),
    valorCalculado: 0,
    valorAjustado: 0,
    metodo: "PIX",
    observacao: "",
    lancarDespesa: true,
  });
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  // Avisos na tela: registrado com sucesso / não registrado.
  const [notice, setNotice] = useState<{ kind: "ok" | "erro" | "aviso"; title: string; text: string } | null>(null);
  const showNotice = (kind: "ok" | "erro" | "aviso", title: string, text: string) => {
    setNotice({ kind, title, text });
    window.setTimeout(() => setNotice((current) => (current && current.text === text ? null : current)), kind === "erro" ? 9000 : 5000);
  };
  const [batchKeepCustom, setBatchKeepCustom] = useState(true);

  // Printable Receipt View Modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeReceiptRecord, setActiveReceiptRecord] = useState<{
    emp: VTEmployeeItem;
    record: VTPaymentRecord;
  } | null>(null);

  const [receiptEmail, setReceiptEmail] = useState("");

  // History Modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyEmp, setHistoryEmp] = useState<VTEmployeeItem | null>(null);

  // New Employee Form state
  const [empForm, setEmpForm] = useState<Partial<VTEmployeeItem>>({
    nome: "",
    mat: "",
    setor: "Atendimento",
    operadora: "Bilhete Único SP (SPTrans)",
    cartaoNumero: "",
    tarifaIda: 5.0,
    tarifaVolta: 5.0,
    diasPrevistos: businessDaysInfo.businessDays,
    faltas: 0,
    salarioBase: 2000.0,
    uberAdicional: 0,
    statusRecarga: "pendente",
    trechos: [{ id: "t_1", tipo: "onibus", tarifa: 5.0, ida: 1, volta: 1 }],
    formaPagamento: "pix",
    periodicidade: "mensal",
    diasSemana: [...DEFAULT_SCHEDULE],
    diasManual: false,
  });

  // Cliques seguidos em faltas: salva uma vez só, depois que a pessoa para de clicar.
  const faltasSaveTimer = useRef<number | null>(null);
  const hasUnsavedFaltas = useRef(false);

  // ---------- Só aparecem no VT os funcionários cadastrados nesta unidade ----------
  const unitStaff = useMemo(
    () => registeredEmployees.filter((person) => person.unidade === currentTenantId && person.active !== false),
    [registeredEmployees, currentTenantId],
  );
  /** Acha no cadastro da unidade a pessoa deste VT (pelo vínculo; em VTs antigos, pela matrícula ou pelo nome). */
  const findStaff = (item: VTEmployeeItem): Employee | null => {
    if (item.employeeId) return unitStaff.find((person) => person.id === item.employeeId) || null;
    if (item.mat) {
      const byMat = unitStaff.find((person) => person.matricula && normText(person.matricula) === normText(item.mat));
      if (byMat) return byMat;
    }
    return unitStaff.find((person) => normText(person.nome) === normText(item.nome)) || null;
  };
  const [showUnlinked, setShowUnlinked] = useState(false);
  const linkedEmployees: VTEmployeeItem[] = employees.flatMap((item) => {
    const person = findStaff(item);
    return person ? [{ ...item, employeeId: person.id, nome: person.nome, mat: person.matricula || item.mat, setor: person.cargo || item.setor }] : [];
  });
  const unlinkedEmployees = employees.filter((item) => !findStaff(item));
  const unlinkedIds = new Set(unlinkedEmployees.map((item) => item.id));
  /** Lista que aparece na tela, nos totais e nos arquivos. */
  const unitEmployees = showUnlinked ? [...linkedEmployees, ...unlinkedEmployees] : linkedEmployees;
  const staffWithoutVt = unitStaff.filter((person) => !linkedEmployees.some((item) => item.employeeId === person.id));
  const staffFlaggedVt = staffWithoutVt.filter((person) => person.vt);
  const staffEmail = (item: VTEmployeeItem) =>
    (item.employeeId && registeredEmployees.find((person) => person.id === item.employeeId)?.email) || findStaff(item)?.email || "";

  // Ao abrir um comprovante, já traz o e-mail do cadastro.
  useEffect(() => {
    if (activeReceiptRecord) setReceiptEmail(staffEmail(activeReceiptRecord.emp));
  }, [activeReceiptRecord]);

  /** Corridas extras de um pagamento: as gravadas no recibo ou, em recibos antigos, as do período pago. */
  const recordExtras = (emp: VTEmployeeItem, record: VTPaymentRecord): VTTransporteExtra[] => {
    if (record.extras) return record.extras;
    const a = parseIso(record.dataInicio || "");
    const b = parseIso(record.dataFim || "");
    return a && b ? extrasInPeriod(emp, { inicio: a, fim: b }) : [];
  };
  const extraLine = (x: VTTransporteExtra) => {
    const d = parseIso(x.data);
    return `${d ? brDate(d) : x.data} · ${extraTransportLabel(x.tipo)} · ${extraRouteLabel(x.trajeto)}${x.motivo ? ` (${x.motivo})` : ""}`;
  };

  /** Abre o e-mail com o termo escrito, para o colaborador conferir e assinar. */
  const sendReceiptByEmail = () => {
    if (!activeReceiptRecord) return;
    const to = receiptEmail.trim();
    if (to && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      showNotice("aviso", "E-mail inválido", "Confira o e-mail do colaborador.");
      return;
    }
    const { emp, record } = activeReceiptRecord;
    const lines = [
      `Olá, ${emp.nome}.`,
      "",
      "Segue o termo de recebimento do Vale-Transporte para você conferir e assinar.",
      "",
      `Unidade: ${unitLabel}`,
      `Colaborador: ${emp.nome}${emp.mat ? ` (matrícula ${emp.mat})` : ""}`,
      `Período: ${record.periodoRef}`,
      `Dias: ${record.dias}`,
      ...(() => {
        const ex = recordExtras(emp, record);
        if (!ex.length) return [];
        const tot = ex.reduce((s2, x) => s2 + (Number(x.valor) || 0), 0);
        return [`Transporte extra pago pela empresa (${formatBrl2(tot)}):`, ...ex.map((x) => `  - ${extraLine(x)}: ${formatBrl2(x.valor)}`)];
      })(),
      `Valor total: ${formatBrl2(record.valor)}`,
      record.descontoCltAbatido ? `Desconto em folha (até 6%): ${formatBrl2(record.descontoCltAbatido)}` : "",
      `Forma de entrega: ${record.metodo || "PIX"} — ${paymentDestination(emp)}`,
      `Data: ${record.data}`,
      "",
      "DECLARAÇÃO",
      "Declaro para os devidos fins legais ter recebido a quantia/crédito acima discriminada a título de Vale-Transporte, destinada exclusivamente ao meu deslocamento diário residência-trabalho e vice-versa, estando ciente de que o uso indevido do benefício constitui falta grave nos termos do artigo 7º, §3º do Decreto nº 95.247/1987.",
      "",
      "Para assinar, responda este e-mail com \"Li e concordo\" ou devolva o termo impresso e assinado.",
      "",
      "Obrigado.",
    ].filter((line, index, all) => line !== "" || all[index - 1] !== "");
    const subject = `Termo de Vale-Transporte — ${record.periodoRef} — ${emp.nome}`;
    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    showNotice("ok", "E-mail aberto", to ? `O termo foi preparado para ${to}. Confira e clique em enviar no seu e-mail.` : "O termo foi preparado. Informe o destinatário no seu e-mail e envie.");
  };

  /** Preenche o formulário do VT com os dados do cadastro do funcionário. */
  const pickStaff = (personId: string) => {
    const person = unitStaff.find((p) => p.id === personId);
    if (!person) { setEmpForm((p) => ({ ...p, employeeId: undefined })); return; }
    const forma = paymentFromRegistry(person.paymentMethod);
    setEmpForm((p) => ({
      ...p,
      employeeId: person.id,
      nome: person.nome,
      mat: person.matricula || "",
      setor: person.cargo || p.setor,
      salarioBase: Number(person.salary) || p.salarioBase,
      ...(forma ? { formaPagamento: forma } : {}),
      ...(forma === "pix" && person.pixKey ? { pixChave: person.pixKey, pixTipo: pixTypeOf(person.pixKey) } : {}),
      ...(forma === "deposito" && person.bank ? { banco: person.bank } : {}),
    }));
  };

  // Keep state synced when tenant changes
  useEffect(() => {
    // Enquanto há faltas ainda não salvas, não deixa uma resposta antiga da nuvem desfazer os cliques.
    if (hasUnsavedFaltas.current) return;
    const config = hasSavedConfig ? vtConfigs[currentTenantId] : {
      ...currentConfig,
      employees: [],
    };
    setForm(config);
    setEmployees(config.employees ?? []);
  }, [currentTenantId, vtConfigs, hasSavedConfig]);

  // Valores de cada colaborador: mês inteiro e o período de pagamento atual (semana, quinzena ou mês).
  const hoje = new Date();
  const calculateEmpValues = (emp: VTEmployeeItem) => {
    const diaria = empDiaria(emp);
    const escala = emp.diasSemana?.length ? emp.diasSemana : DEFAULT_SCHEDULE;
    const diasPrevistosMes = monthWorkDays(emp, hoje, form.days || businessDaysInfo.businessDays);
    const diasEfetivos = Math.max(0, diasPrevistosMes - (emp.faltas || 0));
    const custoVtPassagens = diaria * diasEfetivos;
    // Corridas extras (Uber, 99, táxi…) lançadas com data neste mês.
    const extrasDoMes = extrasInPeriod(emp, monthPeriod(hoje));
    const extrasMes = extrasTotal(emp, monthPeriod(hoje));
    const custoTotalVt = custoVtPassagens + (emp.uberAdicional || 0) + extrasMes;

    // Regra CLT: Desconto de até 6% do salário base ou o valor total do benefício
    const tetoDescontoClt = (emp.salarioBase || 0) * (form.descontoCltPct || 0.06);
    const descontoEfetivo = Math.min(custoTotalVt, tetoDescontoClt);
    const subsidioEmpresa = Math.max(0, custoTotalVt - descontoEfetivo);

    // Paid tracking in current month
    const jaPago = emp.quantoJaFoiPagoNoMes || 0;
    const saldoRestante = Math.max(0, custoTotalVt - jaPago);
    const pctPago = custoTotalVt > 0 ? Math.min(100, Math.round((jaPago / custoTotalVt) * 100)) : 0;

    let statusPagamento: "quitado" | "parcial" | "pendente" = "pendente";
    if (jaPago >= custoTotalVt && custoTotalVt > 0) {
      statusPagamento = "quitado";
    } else if (jaPago > 0) {
      statusPagamento = "parcial";
    }

    // Período atual conforme a forma de pagamento da pessoa.
    const periodicidade = emp.periodicidade || "mensal";
    const periodo = periodFor(periodicidade, hoje);
    const diasPeriodo = periodicidade === "mensal" ? diasEfetivos : workingDaysBetween(periodo.inicio, periodo.fim, escala);
    const valorPeriodo = periodicidade === "mensal" ? custoTotalVt : diaria * diasPeriodo + extrasTotal(emp, periodo);
    const pagoPeriodo = periodicidade === "mensal" ? jaPago : paidInPeriod(emp, periodo);

    return {
      diaria,
      escala,
      diasPrevistosMes,
      diasEfetivos,
      custoTotalVt,
      tetoDescontoClt,
      descontoEfetivo,
      subsidioEmpresa,
      jaPago,
      saldoRestante,
      pctPago,
      statusPagamento,
      periodicidade,
      periodo,
      diasPeriodo,
      valorPeriodo,
      pagoPeriodo,
      extrasMes,
      qtdExtrasMes: extrasDoMes.length,
      extrasPendentes: pendingExtras(emp, periodo.fim),
    };
  };

  // Aggregated totals
  const totals = unitEmployees.reduce(
    (acc, emp) => {
      const calc = calculateEmpValues(emp);
      acc.totalConcedido += calc.custoTotalVt;
      acc.totalDescontoClt += calc.descontoEfetivo;
      acc.totalSubsidioEmpresa += calc.subsidioEmpresa;
      acc.totalJaPago += calc.jaPago;
      acc.totalSaldoRestante += calc.saldoRestante;

      if (calc.statusPagamento === "quitado") {
        acc.qtdQuitados++;
      } else if (calc.statusPagamento === "parcial") {
        acc.qtdParciais++;
      } else {
        acc.qtdPendentes++;
      }
      return acc;
    },
    {
      totalConcedido: 0,
      totalDescontoClt: 0,
      totalSubsidioEmpresa: 0,
      totalJaPago: 0,
      totalSaldoRestante: 0,
      qtdQuitados: 0,
      qtdParciais: 0,
      qtdPendentes: 0,
    }
  );

  // Save to cloud
  const handleSave = async (updatedEmployeesList?: VTEmployeeItem[]) => {
    const listToSave = updatedEmployeesList || employees;
    const updatedConfig: VTConfig = {
      ...form,
      diasUteisCalculados: businessDaysInfo.businessDays,
      employees: listToSave,
    };
    await onSaveVtConfig(currentTenantId, updatedConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const saveWithNotice = async (list?: VTEmployeeItem[], okText = "As alterações do VT foram salvas.") => {
    try {
      await handleSave(list);
      showNotice("ok", "Salvo com sucesso", okText);
      return true;
    } catch (error) {
      console.error("Erro ao salvar VT:", error);
      showNotice("erro", "Não foi salvo", "Verifique a internet e tente de novo. Nada foi alterado.");
      return false;
    }
  };

  // Recalcula os dias do mês: quem tem escala própria segue a escala; os demais ficam com os dias úteis do mês.
  const handleApplyAutoBusinessDays = async () => {
    const autoDays = businessDaysInfo.businessDays;
    const updated = employees.map((e) => (e.diasSemana?.length ? { ...e, diasManual: false } : { ...e, diasPrevistos: autoDays, diasManual: false }));
    setEmployees(updated);
    setForm((p) => ({ ...p, days: autoDays, diasUteisCalculados: autoDays }));
    await saveWithNotice(updated, "Dias do mês recalculados pela escala de cada colaborador.");
  };

  // Filtered employees
  const filteredEmployees = unitEmployees.filter((emp) => {
    if (statusFilter !== "all") {
      const calc = calculateEmpValues(emp);
      if (statusFilter === "quitado" && calc.statusPagamento !== "quitado") return false;
      if (statusFilter === "parcial" && calc.statusPagamento !== "parcial") return false;
      if (statusFilter === "pendente" && calc.statusPagamento !== "pendente") return false;
    }

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      emp.nome.toLowerCase().includes(q) ||
      emp.mat.toLowerCase().includes(q) ||
      emp.setor.toLowerCase().includes(q) ||
      emp.operadora.toLowerCase().includes(q) ||
      (emp.cartaoNumero && emp.cartaoNumero.toLowerCase().includes(q))
    );
  });

  // Inline adjuster for absences
  const updateEmployeeFaltas = (id: string, delta: number) => {
    setEmployees((current) => {
      const updated = current.map((e) => {
        if (e.id !== id) return e;
        const maxFaltas = calculateEmpValues({ ...e, faltas: 0 }).diasPrevistosMes;
        const newFaltas = Math.min(maxFaltas, Math.max(0, (e.faltas || 0) + delta));
        return { ...e, faltas: newFaltas };
      });
      hasUnsavedFaltas.current = true;
      if (faltasSaveTimer.current) window.clearTimeout(faltasSaveTimer.current);
      faltasSaveTimer.current = window.setTimeout(async () => {
        try {
          await handleSave(updated);
        } catch (error: any) {
          showNotice("erro", "Faltas não salvas", `Não foi possível salvar as faltas${error?.message ? ` (${String(error.message).slice(0, 120)})` : ""}. Clique em Salvar para tentar de novo.`);
        } finally {
          hasUnsavedFaltas.current = false;
        }
      }, 700);
      return updated;
    });
  };

  const periodOptions = (emp: VTEmployeeItem): { id: string; label: string; period: Period }[] => {
    const c = calculateEmpValues(emp);
    const semana = weekPeriod(hoje);
    const quinzena1 = fortnightPeriod(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
    const quinzena2 = fortnightPeriod(new Date(hoje.getFullYear(), hoje.getMonth(), 16));
    return [
      { id: "semana", label: "Esta semana", period: semana },
      { id: "semana_seguinte", label: "Próxima semana", period: { ...nextPeriod(semana, "semanal"), tipo: "semana" as const } },
      { id: "quinzena_1", label: "1ª quinzena", period: quinzena1 },
      { id: "quinzena_2", label: "2ª quinzena", period: quinzena2 },
      { id: "mes", label: "Mês inteiro", period: monthPeriod(hoje) },
    ].filter((o) => o.id !== "semana_seguinte" || c.periodicidade === "semanal");
  };

  const fillPaymentForPeriod = (emp: VTEmployeeItem, period: Period, tipo: PeriodTipo) => {
    const c = calculateEmpValues(emp);
    const isMonth = tipo === "mes";
    const dias = isMonth ? c.diasEfetivos : workingDaysBetween(period.inicio, period.fim, c.escala);
    // Corridas extras: só as que ainda não foram pagas (inclusive de datas anteriores).
    const pendentes = pendingExtras(emp, period.fim);
    const extras = sumExtras(pendentes);
    const qtdExtras = pendentes.length;
    const passagens = c.diaria * dias + (isMonth ? emp.uberAdicional || 0 : 0);
    const passagensJaPagas = paidPassagensInPeriod(emp, period);
    const valor = Math.max(0, Number((Math.max(0, passagens - passagensJaPagas) + extras).toFixed(2)));
    setPaymentForm((prev) => ({
      ...prev,
      tipoPeriodo: tipo,
      dias,
      dataInicio: isoDate(period.inicio),
      dataFim: isoDate(period.fim),
      valorCalculado: valor,
      valorAjustado: valor,
      observacao: `VT ${period.label} · ${dias} dia(s) de trabalho${qtdExtras ? ` · inclui ${qtdExtras} transporte(s) extra(s): ${formatBrl2(extras)}` : ""}`,
    }));
  };

  const openPaymentModalForEmployee = (emp: VTEmployeeItem) => {
    const c = calculateEmpValues(emp);
    // Começa no período da pessoa; se já estiver pago, sugere o próximo.
    let period = c.periodo;
    if (c.periodicidade !== "mensal" && c.pagoPeriodo >= c.valorPeriodo && c.valorPeriodo > 0) period = nextPeriod(period, c.periodicidade);
    const metodo = PAYMENT_FORMS.find((f) => f.id === (emp.formaPagamento || "cartao"))?.metodo || "PIX";
    setSelectedEmpForPayment(emp);
    setPaymentForm((prev) => ({ ...prev, metodo, lancarDespesa: true }));
    fillPaymentForPeriod(emp, period, c.periodicidade === "mensal" ? "mes" : period.tipo);
    setIsPaymentModalOpen(true);
  };

  const handleCustomRange = (inicio: string, fim: string) => {
    if (!selectedEmpForPayment) return;
    const a = parseIso(inicio);
    const b = parseIso(fim);
    if (!a || !b) { setPaymentForm((p) => ({ ...p, dataInicio: inicio, dataFim: fim })); return; }
    fillPaymentForPeriod(selectedEmpForPayment, { inicio: a, fim: b, tipo: "outro", label: `${brDate(a)} a ${brDate(b)}` }, "outro");
  };

  // Registra o pagamento, avisa se deu certo e abre o comprovante.
  const handleConfirmPaymentAndEmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpForPayment || isConfirmingPayment) return;

    const emp = selectedEmpForPayment;
    const calc = calculateEmpValues(emp);
    const valorPago = Number(paymentForm.valorAjustado) || 0;
    const diasPagos = Number(paymentForm.dias) || 0;
    if (valorPago <= 0) {
      showNotice("aviso", "Valor zerado", "Informe um valor maior que zero para registrar o pagamento.");
      return;
    }
    const inicio = parseIso(paymentForm.dataInicio);
    const fim = parseIso(paymentForm.dataFim);
    if (!inicio || !fim || fim < inicio) {
      showNotice("aviso", "Período inválido", "Confira a data inicial e a data final.");
      return;
    }

    const extrasPagos = pendingExtras(emp, fim);
    const valorExtrasPagos = Number(extrasPagos.reduce((s2, x) => s2 + (Number(x.valor) || 0), 0).toFixed(2));
    const newRecord: VTPaymentRecord = {
      id: "vtp_" + Date.now(),
      extras: extrasPagos,
      valorExtras: valorExtrasPagos,
      valorPassagens: Number(Math.max(0, valorPago - valorExtrasPagos).toFixed(2)),
      data: isoDate(new Date()),
      dias: diasPagos,
      valor: valorPago,
      periodoRef: `${brDate(inicio)} a ${brDate(fim)}/${fim.getFullYear()} (${diasPagos} dia${diasPagos === 1 ? "" : "s"} de trabalho)`,
      dataInicio: paymentForm.dataInicio,
      dataFim: paymentForm.dataFim,
      metodo: paymentForm.metodo,
      observacao: paymentForm.observacao,
      descontoCltAbatido: calc.diasEfetivos > 0 ? Number(((calc.descontoEfetivo * diasPagos) / calc.diasEfetivos).toFixed(2)) : 0,
      registradoPor: userSession?.name || "Gestor de Franquias",
    };

    const novoHistorico = [newRecord, ...(emp.historicoPagamentos || [])];
    const novoQuantoJaFoiPago = (emp.quantoJaFoiPagoNoMes || 0) + valorPago;
    const novoDiasPagos = (emp.diasPagosNoMes || 0) + diasPagos;
    const novoStatusRecarga = novoQuantoJaFoiPago >= calc.custoTotalVt ? "creditado" : novoQuantoJaFoiPago > 0 ? "processado" : "pendente";

    const previous = employees;
    const updatedEmployees = employees.map((eItem) =>
      eItem.id !== emp.id
        ? eItem
        : {
            ...eItem,
            quantoJaFoiPagoNoMes: Number(novoQuantoJaFoiPago.toFixed(2)),
            diasPagosNoMes: novoDiasPagos,
            statusRecarga: novoStatusRecarga as VTEmployeeItem["statusRecarga"],
            historicoPagamentos: novoHistorico,
            transportesExtras: (eItem.transportesExtras || []).map((x) =>
              extrasPagos.some((p) => p.id === x.id) ? { ...x, pagoEm: isoDate(new Date()), pagamentoId: newRecord.id } : x
            ),
          }
    );

    setIsConfirmingPayment(true);
    setEmployees(updatedEmployees);
    try {
      await handleSave(updatedEmployees);
    } catch (error) {
      console.error("Erro ao registrar pagamento de VT:", error);
      setEmployees(previous);
      setIsConfirmingPayment(false);
      showNotice("erro", "Pagamento NÃO registrado", "Não foi possível salvar. Confira a internet e tente de novo; nada foi gravado.");
      return;
    }

    let despesaOk = true;
    if (paymentForm.lancarDespesa && onCreateEntry) {
      try {
        // No extrato, o Uber/transporte extra sai numa linha própria, separado das passagens.
        const extrasNoPagamento = Math.min(valorPago, valorExtrasPagos);
        const valorPassagensPago = Number((valorPago - extrasNoPagamento).toFixed(2));
        if (valorPassagensPago > 0) {
          await onCreateEntry({
            tenant: currentTenantId,
            type: "despesa",
            date: isoDate(new Date()),
            value: valorPassagensPago,
            desc: `Vale Transporte - ${emp.nome} (${diasPagos} dias)`,
            catId: "vt",
            catName: "Vale Transporte",
            pay: paymentForm.metodo || "PIX",
            note: paymentForm.observacao,
            conciliationStatus: "matched",
          });
        }
        // Uma linha por corrida, com a data da corrida.
        if (extrasNoPagamento > 0) {
          for (const x of extrasPagos) {
            await onCreateEntry({
              tenant: currentTenantId,
              type: "despesa",
              date: x.data || isoDate(new Date()),
              value: Number((Number(x.valor) || 0).toFixed(2)),
              desc: `${extraTransportLabel(x.tipo)} - ${emp.nome} - ${extraRouteLabel(x.trajeto).toLowerCase()}${x.motivo ? ` (${x.motivo})` : ""}`.slice(0, 200),
              catId: "vt",
              catName: "Vale Transporte",
              pay: paymentForm.metodo || "PIX",
              note: `Transporte extra pago junto com o VT de ${emp.nome}`,
              conciliationStatus: "matched",
            });
          }
        }
      } catch (err) {
        console.error("Erro ao lançar despesa de VT:", err);
        despesaOk = false;
      }
    }

    setIsConfirmingPayment(false);
    setIsPaymentModalOpen(false);
    if (despesaOk) {
      showNotice("ok", "Pagamento registrado com sucesso", `${formatBrl2(valorPago)} para ${emp.nome} via ${paymentForm.metodo}. O comprovante está pronto para imprimir.`);
    } else {
      showNotice("aviso", "Pagamento registrado", "O pagamento foi salvo, mas a despesa não entrou no financeiro. Lance a despesa manualmente.");
    }

    const updatedEmp = updatedEmployees.find((item) => item.id === emp.id) || emp;
    setActiveReceiptRecord({ emp: updatedEmp, record: newRecord });
    setIsReceiptModalOpen(true);
  };

  // Delete payment record from history
  // ---------- Transporte extra (Uber, 99, táxi…) ----------
  const [extrasEmpId, setExtrasEmpId] = useState<string | null>(null);
  const extrasEmp = extrasEmpId ? employees.find((e) => e.id === extrasEmpId) || null : null;
  const emptyExtra = () => ({ data: isoDate(new Date()), tipo: "uber" as VTTransporteExtra["tipo"], trajeto: "volta" as VTTransporteExtra["trajeto"], valor: "", motivo: "" });
  const [extraForm, setExtraForm] = useState(emptyExtra());
  const [savingExtra, setSavingExtra] = useState(false);

  const openExtrasModal = (emp: VTEmployeeItem) => {
    setExtraForm(emptyExtra());
    setExtrasEmpId(emp.id);
  };

  const handleAddExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extrasEmp || savingExtra) return;
    const valor = Number(String(extraForm.valor).replace(",", ".")) || 0;
    if (valor <= 0) { showNotice("aviso", "Informe o valor", "Digite quanto custou a corrida."); return; }
    if (!parseIso(extraForm.data)) { showNotice("aviso", "Informe a data", "Escolha o dia da corrida."); return; }
    const novo: VTTransporteExtra = {
      id: `ext_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      data: extraForm.data,
      tipo: extraForm.tipo,
      trajeto: extraForm.trajeto,
      valor: Math.round(valor * 100) / 100,
      motivo: extraForm.motivo.trim() || undefined,
      registradoPor: userSession?.name || "Gestor de Franquias",
      criadoEm: new Date().toISOString(),
    };
    const previous = employees;
    const updated = employees.map((emp) => emp.id === extrasEmp.id ? { ...emp, transportesExtras: [novo, ...(emp.transportesExtras || [])] } : emp);
    setSavingExtra(true);
    setEmployees(updated);
    const ok = await saveWithNotice(updated, `${extraTransportLabel(novo.tipo)} de ${formatBrl2(novo.valor)} incluído no VT de ${extrasEmp.nome}.`);
    setSavingExtra(false);
    if (!ok) { setEmployees(previous); return; }
    setExtraForm((p) => ({ ...emptyExtra(), data: p.data, tipo: p.tipo, trajeto: p.trajeto }));
  };

  const handleDeleteExtra = async (empId: string, extraId: string) => {
    if (!confirm("Remover este transporte extra do VT?")) return;
    const previous = employees;
    const updated = employees.map((emp) => emp.id === empId ? { ...emp, transportesExtras: (emp.transportesExtras || []).filter((x) => x.id !== extraId) } : emp);
    setEmployees(updated);
    const ok = await saveWithNotice(updated, "Transporte extra removido do VT.");
    if (!ok) setEmployees(previous);
  };

  const handleDeletePaymentRecord = async (empId: string, recordId: string) => {
    if (!confirm("Tem certeza que deseja cancelar e excluir este registro de pagamento de VT?")) return;

    const updatedEmployees = employees.map((emp) => {
      if (emp.id !== empId) return emp;
      const history = emp.historicoPagamentos || [];
      const filteredHistory = history.filter((r) => r.id !== recordId);

      const novoQuantoJaFoiPago = filteredHistory.reduce((sum, r) => sum + (r.valor || 0), 0);
      const novoDiasPagos = filteredHistory.reduce((sum, r) => sum + (r.dias || 0), 0);
      const calc = calculateEmpValues(emp);

      const novoStatus =
        novoQuantoJaFoiPago >= calc.custoTotalVt
          ? "creditado"
          : novoQuantoJaFoiPago > 0
          ? "processado"
          : "pendente";

      return {
        ...emp,
        quantoJaFoiPagoNoMes: Number(novoQuantoJaFoiPago.toFixed(2)),
        diasPagosNoMes: novoDiasPagos,
        statusRecarga: novoStatus as any,
        historicoPagamentos: filteredHistory,
        // Corridas que estavam neste pagamento voltam a ficar "a pagar".
        transportesExtras: (emp.transportesExtras || []).map((x) => (x.pagamentoId === recordId ? { ...x, pagoEm: undefined, pagamentoId: undefined } : x)),
      };
    });

    setEmployees(updatedEmployees);
    const ok = await saveWithNotice(updatedEmployees, "Pagamento cancelado e removido do histórico.");
    if (!ok) { setEmployees(employees); return; }

    if (historyEmp && historyEmp.id === empId) {
      setHistoryEmp(updatedEmployees.find((e) => e.id === empId) || null);
    }
  };

  // Add or edit employee
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee && !empForm.employeeId) {
      showNotice("aviso", "Escolha o funcionário", "No VT só entram funcionários cadastrados nesta unidade. Escolha um da lista ou cadastre em Funcionários.");
      return;
    }
    if (!empForm.nome?.trim()) return;

    let updatedList: VTEmployeeItem[] = [];

    // Com transportes cadastrados, ida e volta são somadas a partir deles (compatível com relatórios antigos).
    const trechosValidos = (empForm.trechos || []).filter((t) => (Number(t.tarifa) || 0) > 0 && (Number(t.ida) || 0) + (Number(t.volta) || 0) > 0);
    const derived = trechosValidos.length ? idaVoltaFromTrechos(trechosValidos) : null;
    const extra: Partial<VTEmployeeItem> = {
      trechos: trechosValidos,
      tarifaIda: derived ? derived.ida : Number(empForm.tarifaIda) || 0,
      tarifaVolta: derived ? derived.volta : Number(empForm.tarifaVolta) || 0,
      formaPagamento: empForm.formaPagamento || "cartao",
      periodicidade: empForm.periodicidade || "mensal",
      diasSemana: empForm.diasSemana?.length ? empForm.diasSemana : [...DEFAULT_SCHEDULE],
      diasManual: Boolean(empForm.diasManual),
      diasPrevistos: empForm.diasManual
        ? Number(empForm.diasPrevistos) || 0
        : monthWorkDays({ diasSemana: empForm.diasSemana?.length ? empForm.diasSemana : DEFAULT_SCHEDULE, diasPrevistos: 0 }, hoje, businessDaysInfo.businessDays),
    };
    if (extra.formaPagamento === "pix" && !empForm.pixChave?.trim()) {
      showNotice("aviso", "Falta a chave PIX", "Informe a chave PIX ou escolha outra forma de pagamento.");
      return;
    }
    if (extra.formaPagamento === "deposito" && (!empForm.banco?.trim() || !empForm.conta?.trim())) {
      showNotice("aviso", "Faltam dados da conta", "Informe pelo menos o banco e o número da conta.");
      return;
    }

    if (editingEmployee) {
      updatedList = employees.map((emp) =>
        emp.id === editingEmployee.id
          ? ({ ...emp, ...empForm, ...extra } as VTEmployeeItem)
          : emp
      );
      setEditingEmployee(null);
    } else {
      const newEmp: VTEmployeeItem = {
        id: "vt_" + Date.now(),
        employeeId: empForm.employeeId,
        nome: empForm.nome.trim(),
        mat: empForm.mat?.trim() || String(Math.floor(1000 + Math.random() * 9000)),
        setor: empForm.setor || "Geral",
        operadora: empForm.operadora || "Bilhete Único SP (SPTrans)",
        cartaoNumero: empForm.cartaoNumero || "0000.0000.0000",
        tarifaIda: Number(empForm.tarifaIda) || 5.0,
        tarifaVolta: Number(empForm.tarifaVolta) || 5.0,
        diasPrevistos: Number(empForm.diasPrevistos) || businessDaysInfo.businessDays,
        faltas: Number(empForm.faltas) || 0,
        salarioBase: Number(empForm.salarioBase) || 2000.0,
        uberAdicional: Number(empForm.uberAdicional) || 0,
        statusRecarga: "pendente",
        quantoJaFoiPagoNoMes: 0,
        diasPagosNoMes: 0,
        historicoPagamentos: [],
        pixTipo: empForm.pixTipo,
        pixChave: empForm.pixChave?.trim(),
        banco: empForm.banco?.trim(),
        agencia: empForm.agencia?.trim(),
        conta: empForm.conta?.trim(),
        tipoConta: empForm.tipoConta,
        ...extra,
      } as VTEmployeeItem;
      updatedList = [...employees, newEmp];
    }

    setEmployees(updatedList);
    try {
      await handleSave(updatedList);
    } catch (error) {
      console.error("Erro ao salvar colaborador de VT:", error);
      setEmployees(employees);
      showNotice("erro", "Colaborador NÃO salvo", "Não foi possível salvar. Confira a internet e tente de novo.");
      return;
    }
    showNotice("ok", editingEmployee ? "Cadastro atualizado" : "Colaborador cadastrado", `${empForm.nome?.trim()} foi salvo com sucesso.`);
    setIsAddModalOpen(false);

    setEmpForm({
      nome: "",
      mat: "",
      setor: "Atendimento",
      operadora: "Bilhete Único SP (SPTrans)",
      cartaoNumero: "",
      tarifaIda: 5.0,
      tarifaVolta: 5.0,
      diasPrevistos: businessDaysInfo.businessDays,
      faltas: 0,
      salarioBase: 2000.0,
      uberAdicional: 0,
      statusRecarga: "pendente",
      trechos: [{ id: "t_1", tipo: "onibus", tarifa: 5.0, ida: 1, volta: 1 }],
      formaPagamento: "pix",
      periodicidade: "mensal",
      diasSemana: [...DEFAULT_SCHEDULE],
      diasManual: false,
    });
  };

  const openAddModal = (personId?: string) => {
    setEditingEmployee(null);
    setEmpForm((p) => ({ ...p, employeeId: undefined, nome: "", mat: "", setor: "Atendimento", pixChave: "", banco: "", agencia: "", conta: "" }));
    if (personId) pickStaff(personId);
    setIsAddModalOpen(true);
  };

  const openEditModal = (emp: VTEmployeeItem) => {
    setEditingEmployee(emp);
    setEmpForm({
      ...emp,
      // Cadastros antigos (só ida/volta) viram um transporte editável.
      trechos: emp.trechos?.length ? emp.trechos : [{ id: "t_1", tipo: "onibus", tarifa: Number(emp.tarifaIda) || 0, ida: 1, volta: emp.tarifaVolta ? 1 : 0 }],
      formaPagamento: emp.formaPagamento || "cartao",
      periodicidade: emp.periodicidade || "mensal",
      diasSemana: emp.diasSemana?.length ? emp.diasSemana : [...DEFAULT_SCHEDULE],
      diasManual: emp.diasManual ?? !emp.diasSemana?.length,
    });
    setIsAddModalOpen(true);
  };

  const handleDeleteEmployee = async (id: string) => {
    if (confirm("Deseja remover este colaborador da folha de Vale Transporte?")) {
      const updated = employees.filter((e) => e.id !== id);
      setEmployees(updated);
      const ok = await saveWithNotice(updated, "Colaborador removido do VT.");
      if (!ok) setEmployees(employees);
    }
  };

  // Batch actions
  const hasOwnSchedule = (e: VTEmployeeItem) =>
    Boolean(e.diasSemana?.length && e.diasSemana.join(",") !== DEFAULT_SCHEDULE.join(","));
  const applyBatchDays = async () => {
    const updated = employees.map((e) =>
      batchKeepCustom && hasOwnSchedule(e) ? e : { ...e, diasPrevistos: batchDaysValue, diasManual: true }
    );
    setEmployees(updated);
    setForm((prev) => ({ ...prev, days: batchDaysValue }));
    const ok = await saveWithNotice(updated, `${batchDaysValue} dias aplicados${batchKeepCustom ? " (escalas próprias mantidas)" : " a todos"}.`);
    if (ok) setIsBatchDaysModalOpen(false);
  };

  // CSV Exports
  const handleDownloadCsvRecarga = () => {
    const rows = [
      [
        "Nome do Colaborador",
        "Matrícula",
        "Operadora do Cartão",
        "Número do Cartão",
        "Dias Efetivos",
        "Transporte Extra (R$)",
        "Custo Total Mês (R$)",
        "Já Pago no Mês (R$)",
        "Saldo Restante (R$)",
        "Status Pagamento",
      ],
    ];
    unitEmployees.forEach((emp) => {
      const calc = calculateEmpValues(emp);
      rows.push([
        emp.nome,
        emp.mat,
        emp.operadora,
        emp.cartaoNumero || "Não informado",
        String(calc.diasEfetivos),
        calc.extrasMes.toFixed(2),
        calc.custoTotalVt.toFixed(2),
        calc.jaPago.toFixed(2),
        calc.saldoRestante.toFixed(2),
        calc.statusPagamento,
      ]);
    });

    const csvContent = "\ufeff" + rows.map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Pedido_Recarga_VT_${currentTenantId}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleDownloadCsvFolha = () => {
    const rows = [
      [
        "Colaborador",
        "Matrícula",
        "Setor",
        "Salário Base (R$)",
        "Diária (R$)",
        "Dias Previstos",
        "Faltas",
        "Dias Efetivos",
        "Transporte Extra (R$)",
        "Custo Total VT (R$)",
        "Já Pago (R$)",
        "Desconto CLT 6% (R$)",
        "Custo Franqueadora/Loja (R$)",
      ],
    ];
    unitEmployees.forEach((emp) => {
      const calc = calculateEmpValues(emp);
      rows.push([
        emp.nome,
        emp.mat,
        emp.setor,
        emp.salarioBase.toFixed(2),
        calc.diaria.toFixed(2),
        String(emp.diasPrevistos),
        String(emp.faltas),
        String(calc.diasEfetivos),
        calc.extrasMes.toFixed(2),
        calc.custoTotalVt.toFixed(2),
        calc.jaPago.toFixed(2),
        calc.descontoEfetivo.toFixed(2),
        calc.subsidioEmpresa.toFixed(2),
      ]);
    });

    const csvContent = "\ufeff" + rows.map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Relatorio_Contabil_VT_CLT_${currentTenantId}.csv`;
    link.click();
  };

  const pctGeral = totals.totalConcedido > 0 ? Math.min(100, Math.round((totals.totalJaPago / totals.totalConcedido) * 100)) : 0;
  const iniciais = (nome: string) => nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  const statusPills: { id: string; label: string; count: number; active: string }[] = [
    { id: "all", label: "Todos", count: unitEmployees.length, active: "bg-[#152238] text-white border-[#152238]" },
    { id: "pendente", label: "A pagar", count: totals.qtdPendentes, active: "bg-red-600 text-white border-red-600" },
    { id: "parcial", label: "Pagos em parte", count: totals.qtdParciais, active: "bg-amber-500 text-white border-amber-500" },
    { id: "quitado", label: "Quitados", count: totals.qtdQuitados, active: "bg-[#3c63da] text-white border-[#3c63da]" },
  ];

  return (
    <div className="space-y-3.5 animate-in fade-in duration-150">
      {/* Resumo do mês: o que importa em um só lugar */}
      <div className="rounded-2xl border border-[#e5eaf1] bg-white shadow-xs overflow-hidden">
        <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-3 lg:w-64 shrink-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3c63da] text-white shrink-0">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-[#152238]">{businessDaysInfo.monthName} de {businessDaysInfo.year}</div>
              <div className="text-xs text-[#69778c]">
                <strong className="text-[#3c63da]">{businessDaysInfo.businessDays} dias úteis</strong> · {unitEmployees.length} colaborador{unitEmployees.length === 1 ? "" : "es"}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#69778c]">Pago no mês</div>
                <div className="font-mono text-2xl font-extrabold text-[#152238]">
                  {formatBrl(totals.totalJaPago)} <span className="text-sm font-bold text-[#69778c]">de {formatBrl(totals.totalConcedido)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Falta pagar</div>
                <div className="font-mono text-xl font-extrabold text-amber-700">{formatBrl(totals.totalSaldoRestante)}</div>
              </div>
            </div>
            <div className="mt-2 h-2.5 rounded-full bg-[#f0f4f9] overflow-hidden" title={`${pctGeral}% pago`}>
              <div className={`h-full rounded-full transition-all ${pctGeral >= 100 ? "bg-[#152238]" : "bg-[#3c63da]"}`} style={{ width: `${pctGeral}%` }} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-[#e5eaf1] divide-x divide-[#e5eaf1] bg-[#f8faff] text-xs">
          <div className="px-4 py-2.5">
            <span className="text-[#69778c]">Custo da loja (subsídio)</span>
            <strong className="block font-mono text-[#3c63da]">{formatBrl(totals.totalSubsidioEmpresa)}</strong>
          </div>
          <div className="px-4 py-2.5">
            <span className="text-[#69778c] inline-flex items-center gap-1">
              Desconto em folha (até 6%)
              <span title="Lei 7.418/85: o desconto do VT no salário é de no máximo 6% do salário base. O que passar disso é pago pela empresa." className="cursor-help"><HelpCircle className="h-3 w-3 text-[#3c63da]" /></span>
            </span>
            <strong className="block font-mono text-[#152238]">{formatBrl(totals.totalDescontoClt)}</strong>
          </div>
        </div>
      </div>

      {/* Barra de ações e filtros */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#69778c]" />
          <input
            type="text"
            placeholder="Buscar nome, matrícula, cartão…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-[#e5eaf1] bg-white pl-9 pr-8 py-2 text-xs font-semibold text-[#152238] focus:border-[#3c63da] focus:outline-none"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-2.5 text-[#69778c] hover:text-[#152238]" aria-label="Limpar busca">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {statusPills.map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${statusFilter === pill.id ? pill.active : "bg-white text-[#152238] border-[#e5eaf1] hover:bg-[#f4f7fb]"}`}
            >
              {pill.label} <span className="opacity-70">{pill.count}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full 2xl:w-auto 2xl:ml-auto justify-end">
          <button onClick={handleApplyAutoBusinessDays} className="flex items-center gap-1.5 rounded-xl border border-[#e5eaf1] bg-white px-3 py-2 text-xs font-bold text-[#152238] hover:bg-[#f4f7fb] cursor-pointer" title="Conta os dias do mês pela escala de cada colaborador (quem trabalha seg–sex fica com os dias úteis)">
            <Check className="h-3.5 w-3.5 text-[#3c63da]" /> Recalcular dias
          </button>
          <button onClick={() => setIsBatchDaysModalOpen(true)} className="rounded-xl border border-[#e5eaf1] bg-white p-2 text-[#69778c] hover:bg-[#f4f7fb] cursor-pointer" title="Definir a mesma quantidade de dias para vários colaboradores">
            <Sliders className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleDownloadCsvRecarga} className="flex items-center gap-1.5 rounded-xl border border-[#e5eaf1] bg-white px-3 py-2 text-xs font-bold text-[#152238] hover:bg-[#f4f7fb] cursor-pointer" title="Arquivo para pedir a recarga na operadora">
            <Download className="h-3.5 w-3.5 text-[#3c63da]" /> Recarga
          </button>
          <button onClick={handleDownloadCsvFolha} className="flex items-center gap-1.5 rounded-xl border border-[#e5eaf1] bg-white px-3 py-2 text-xs font-bold text-[#152238] hover:bg-[#f4f7fb] cursor-pointer" title="Resumo dos descontos para a contabilidade">
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#3c63da]" /> Folha
          </button>
          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-1.5 rounded-xl bg-[#152238] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0f1a2c] shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Colaborador
          </button>
          <button onClick={() => void saveWithNotice()} className="flex items-center gap-1.5 rounded-xl bg-[#3c63da] px-4 py-2 text-xs font-bold text-white hover:bg-[#2f52c0] shadow-sm cursor-pointer">
            {isSaved ? <CheckCircle2 className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />}
            {isSaved ? "Salvo!" : "Salvar"}
          </button>
        </div>
      </div>

      {/* Avisos do vínculo com o cadastro de Funcionários */}
      {staffFlaggedVt.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#c9d6f7] bg-[#f5f8ff] px-4 py-2.5 text-xs text-[#152238]">
          <span className="inline-flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#3c63da]" />
            <span><strong>{staffFlaggedVt.length}</strong> {staffFlaggedVt.length === 1 ? "funcionário desta unidade está marcado" : "funcionários desta unidade estão marcados"} com VT no cadastro e ainda não {staffFlaggedVt.length === 1 ? "está" : "estão"} aqui: {staffFlaggedVt.slice(0, 3).map((p) => p.nome.split(" ")[0]).join(", ")}{staffFlaggedVt.length > 3 ? "…" : ""}</span>
          </span>
          <button onClick={() => openAddModal(staffFlaggedVt[0].id)} className="rounded-lg bg-[#3c63da] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#2f52c0] cursor-pointer">
            Adicionar {staffFlaggedVt[0].nome.split(" ")[0]}
          </button>
        </div>
      )}
      {unlinkedEmployees.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
          <span className="inline-flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>
              {showUnlinked ? "Mostrando também " : ""}<strong>{unlinkedEmployees.length}</strong> {unlinkedEmployees.length === 1 ? "registro de VT de quem não está cadastrado" : "registros de VT de quem não está cadastrado"} nesta unidade{showUnlinked ? ". Edite e escolha o funcionário para vincular, ou remova." : ` ${unlinkedEmployees.length === 1 ? "ficou" : "ficaram"} de fora da lista e dos totais.`}
            </span>
          </span>
          <button onClick={() => setShowUnlinked((v) => !v)} className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 cursor-pointer">
            {showUnlinked ? "Ocultar" : "Ver esses registros"}
          </button>
        </div>
      )}

      {/* Lista de colaboradores: um cartão por pessoa (o arranjo se adapta à largura disponível) */}
      <div className="@container space-y-2">
        {filteredEmployees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d2defa] bg-white p-10 text-center">
            <Users className="h-8 w-8 mx-auto text-[#c4cdd9]" />
            {unitEmployees.length ? (
              <>
                <p className="mt-2 text-sm font-bold text-[#152238]">Ninguém com esse filtro</p>
                <p className="text-xs text-[#69778c]">Troque o filtro ou a busca.</p>
              </>
            ) : unitStaff.length === 0 ? (
              <>
                <p className="mt-2 text-sm font-bold text-[#152238]">Nenhum funcionário cadastrado em {unitLabel}</p>
                <p className="text-xs text-[#69778c]">O VT usa o cadastro de Funcionários. Cadastre as pessoas desta unidade primeiro.</p>
                <button onClick={() => onNavigate("employees")} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#3c63da] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#2f52c0] cursor-pointer">
                  <UserPlus className="h-4 w-4" /> Ir para Funcionários
                </button>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm font-bold text-[#152238]">Nenhum funcionário desta unidade no VT ainda</p>
                <p className="text-xs text-[#69778c]">Clique em "Colaborador" e escolha quem recebe vale-transporte.</p>
              </>
            )}
          </div>
        ) : (
          filteredEmployees.map((emp) => {
            const calc = calculateEmpValues(emp);
            const tone = calc.statusPagamento === "quitado"
              ? { bar: "bg-[#3c63da]", badge: "bg-[#edf2ff] text-[#3c63da] border-[#c9d6f7]", label: "Mês quitado", edge: "border-l-[#3c63da]" }
              : calc.statusPagamento === "parcial"
              ? { bar: "bg-amber-500", badge: "bg-amber-50 text-amber-800 border-amber-200", label: `Falta ${formatBrl(calc.saldoRestante)}`, edge: "border-l-amber-500" }
              : { bar: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-200", label: "A pagar", edge: "border-l-red-500" };
            const pagamentos = emp.historicoPagamentos?.length || 0;
            return (
              <div key={emp.id} className={`rounded-2xl border border-[#e5eaf1] border-l-4 ${tone.edge} bg-white shadow-xs p-3.5 sm:p-4`}>
                <div className="grid gap-3 @2xl:grid-cols-2 @5xl:grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1.2fr)_auto] @2xl:items-center">
                  {/* Quem */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-[#edf2ff] text-[#3c63da] font-extrabold text-sm flex items-center justify-center">{iniciais(emp.nome)}</div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-[#152238] truncate">{emp.nome}</div>
                      <div className="text-[11px] text-[#69778c] truncate">{emp.setor}{emp.mat ? ` · Mat. ${emp.mat}` : ""}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {unlinkedIds.has(emp.id) && (
                          <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900" title="Esta pessoa não está no cadastro de Funcionários desta unidade">Sem cadastro nesta unidade</span>
                        )}
                        <span className="rounded-md bg-[#edf2ff] px-1.5 py-0.5 text-[10px] font-bold text-[#3c63da]" title={paymentDestination(emp)}>{paymentFormLabel(emp.formaPagamento)}</span>
                        <span className="rounded-md bg-[#f0f4f9] px-1.5 py-0.5 text-[10px] font-bold text-[#152238]">{PERIODICITIES.find((x) => x.id === calc.periodicidade)?.label}</span>
                        {emp.diasSemana?.length && emp.diasSemana.join(",") !== DEFAULT_SCHEDULE.join(",") ? (
                          <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800" title="Escala própria">{emp.diasSemana.map((d) => WEEKDAYS[d]).join(" ")}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Dias e diária */}
                  <div className="flex items-center gap-3 @5xl:justify-center">
                    <div className="text-center leading-tight min-w-[84px]">
                      <div className="font-mono font-extrabold text-sm text-[#152238] whitespace-nowrap">{calc.diasEfetivos} dias</div>
                      <div className="text-[10px] text-[#69778c] whitespace-nowrap">de VT · {calc.diasPrevistosMes} no mês</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#69778c]">Faltas</span>
                      <div className="inline-flex items-center rounded-xl border border-[#e5eaf1] bg-[#f8faff]">
                        <button type="button" onClick={() => updateEmployeeFaltas(emp.id, -1)} disabled={!emp.faltas} className="h-7 w-7 text-[#152238] font-bold hover:bg-[#edf2ff] rounded-l-xl disabled:opacity-30 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3c63da]" title="Tirar 1 falta (devolve 1 dia de VT)" aria-label="Tirar 1 falta">−</button>
                        <span className={`min-w-[26px] text-center font-mono text-xs font-extrabold ${emp.faltas ? "text-red-600" : "text-[#152238]"}`} aria-live="polite">{emp.faltas || 0}</span>
                        <button type="button" onClick={() => updateEmployeeFaltas(emp.id, 1)} disabled={(emp.faltas || 0) >= calc.diasPrevistosMes} className="h-7 w-7 text-[#152238] font-bold hover:bg-[#edf2ff] rounded-r-xl disabled:opacity-30 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3c63da]" title="Lançar 1 falta (tira 1 dia de VT)" aria-label="Lançar 1 falta">+</button>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#69778c] leading-tight">
                      <div><strong className="font-mono text-[#152238]">{formatBrl2(calc.diaria)}</strong>/dia</div>
                      <div className="whitespace-nowrap" title="Transportes usados por dia">{trechosResumo(emp.trechos) || `${formatBrl2(emp.tarifaIda)} + ${formatBrl2(emp.tarifaVolta)}`}</div>
                      {emp.uberAdicional ? <div className="text-[#152238] font-bold">+ {formatBrl(emp.uberAdicional)} mobilidade</div> : null}
                      {calc.extrasPendentes.length > 0
                        ? <div className="text-amber-800 font-bold whitespace-nowrap" title="Corridas extras ainda não pagas">+ {formatBrl2(calc.extrasPendentes.reduce((s2, x) => s2 + (Number(x.valor) || 0), 0))} Uber a pagar ({calc.extrasPendentes.length})</div>
                        : calc.qtdExtrasMes > 0 ? <div className="text-[#3c63da] font-bold whitespace-nowrap" title="Corridas extras do mês já pagas">Uber pago ({calc.qtdExtrasMes})</div> : null}
                    </div>
                  </div>

                  {/* Dinheiro */}
                  <div className="min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-sm font-extrabold text-[#152238]">{formatBrl(calc.jaPago)} <span className="text-[11px] font-semibold text-[#69778c]">de {formatBrl(calc.custoTotalVt)}</span></span>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${tone.badge}`}>{tone.label}</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-[#f0f4f9] overflow-hidden">
                      <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${calc.pctPago}%` }} />
                    </div>
                    {calc.periodicidade !== "mensal" && (
                      <div className="mt-1.5 text-[11px] text-[#152238]">
                        <strong>{calc.periodo.label}:</strong>{" "}
                        <span className="font-mono">{formatBrl(calc.pagoPeriodo)} de {formatBrl(calc.valorPeriodo)}</span>
                        {calc.pagoPeriodo >= calc.valorPeriodo && calc.valorPeriodo > 0 ? <span className="ml-1 font-bold text-[#3c63da]">· pago</span> : <span className="ml-1 font-bold text-red-600">· a pagar</span>}
                      </div>
                    )}
                    <div className="mt-1.5 flex flex-wrap gap-x-3 text-[10px] text-[#69778c]">
                      <span>Desconto folha: <strong className="font-mono text-[#152238]">{formatBrl(calc.descontoEfetivo)}</strong>{calc.descontoEfetivo >= calc.tetoDescontoClt ? " (teto 6%)" : ""}</span>
                      <span>Custo loja: <strong className="font-mono text-[#3c63da]">{formatBrl(calc.subsidioEmpresa)}</strong></span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => openPaymentModalForEmployee(emp)}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#3c63da] text-white hover:bg-[#2f52c0] font-bold text-xs shadow-2xs cursor-pointer"
                      title="Registrar pagamento e gerar recibo"
                    >
                      <Receipt className="h-3.5 w-3.5" /> Pagar
                    </button>
                    <button
                      onClick={() => { setHistoryEmp(emp); setIsHistoryModalOpen(true); }}
                      disabled={!pagamentos}
                      className="relative p-2 rounded-xl border border-[#e5eaf1] bg-white text-[#69778c] hover:text-[#3c63da] hover:bg-[#edf2ff] disabled:opacity-40 cursor-pointer"
                      title={pagamentos ? `Histórico e recibos (${pagamentos})` : "Ainda sem pagamentos"}
                      aria-label="Histórico e recibos"
                    >
                      <History className="h-3.5 w-3.5" />
                      {pagamentos > 0 && <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-[#3c63da] text-white text-[9px] font-bold flex items-center justify-center">{pagamentos}</span>}
                    </button>
                    <button
                      onClick={() => openExtrasModal(emp)}
                      className="relative flex items-center gap-1 px-2.5 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-bold text-xs cursor-pointer whitespace-nowrap"
                      title="Lançar Uber, 99, táxi ou outra corrida paga pela empresa"
                      aria-label="Transporte extra"
                    >
                      <Car className="h-3.5 w-3.5" /> Uber / extra
                      {calc.extrasPendentes.length > 0 && <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center" title="Corridas a pagar">{calc.extrasPendentes.length}</span>}
                    </button>
                    <button onClick={() => openEditModal(emp)} className="p-2 rounded-xl border border-[#e5eaf1] bg-white text-[#69778c] hover:text-[#3c63da] hover:bg-[#edf2ff] cursor-pointer" title="Editar colaborador" aria-label="Editar colaborador">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDeleteEmployee(emp.id)} className="p-2 rounded-xl border border-[#e5eaf1] bg-white text-[#69778c] hover:text-red-600 hover:bg-red-50 cursor-pointer" title="Remover colaborador" aria-label="Remover colaborador">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {filteredEmployees.length > 0 && (
        <div className="rounded-2xl bg-[#f8faff] border border-[#e5eaf1] px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[#69778c]">{filteredEmployees.length} de {unitEmployees.length} colaborador{unitEmployees.length === 1 ? "" : "es"}</span>
          <span className="flex flex-wrap gap-4 font-mono font-bold">
            <span><span className="font-sans font-normal text-[#69778c]">Previsto </span>{formatBrl(totals.totalConcedido)}</span>
            <span className="text-[#3c63da]"><span className="font-sans font-normal text-[#69778c]">Pago </span>{formatBrl(totals.totalJaPago)}</span>
            <span className="text-amber-700"><span className="font-sans font-normal text-[#69778c]">Falta </span>{formatBrl(totals.totalSaldoRestante)}</span>
          </span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: LANÇAR PAGAMENTO FRACIONADO E EMITIR RECIBO            */}
      {/* ------------------------------------------------------------- */}
      {isPaymentModalOpen && selectedEmpForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#e5eaf1] w-full max-w-xl max-h-[90vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="shrink-0 p-4 sm:p-5 border-b border-[#e5eaf1] flex items-center justify-between bg-[#f8faff]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3c63da] text-white">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#152238]">
                    Registrar pagamento de VT
                  </h3>
                  <p className="text-xs text-[#69778c]">
                    Colaborador: <strong>{selectedEmpForPayment.nome}</strong> (Mat: {selectedEmpForPayment.mat})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="h-8 w-8 rounded-lg bg-white border border-[#e5eaf1] flex items-center justify-center text-[#69778c] hover:bg-[#f4f7fb] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPaymentAndEmitReceipt} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {(() => {
                const emp = selectedEmpForPayment;
                const c = calculateEmpValues(emp);
                const options = periodOptions(emp);
                return (
                  <>
                    {/* Para onde vai o dinheiro */}
                    <div className="grid sm:grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl bg-[#f8faff] border border-[#e5eaf1]">
                        <span className="text-[10px] text-[#69778c] uppercase font-bold block">Recebe por</span>
                        <strong className="text-sm text-[#152238]">{paymentFormLabel(emp.formaPagamento)}</strong>
                        <span className="block text-[11px] text-[#69778c] break-all">{paymentDestination(emp)}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#f8faff] border border-[#e5eaf1]">
                        <span className="text-[10px] text-[#69778c] uppercase font-bold block">Valor por dia</span>
                        <strong className="text-sm font-mono text-[#152238]">{formatBrl2(c.diaria)}</strong>
                        <span className="block text-[11px] text-[#69778c]">{trechosResumo(emp.trechos) || `ida ${formatBrl2(emp.tarifaIda)} + volta ${formatBrl2(emp.tarifaVolta)}`}</span>
                      </div>
                    </div>

                    {/* Período */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-[#69778c] mb-1.5">
                        Período que está sendo pago <span className="normal-case font-semibold">(esta pessoa recebe {PERIODICITIES.find((p) => p.id === c.periodicidade)?.label.toLowerCase()})</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {options.map((o) => {
                          const active = paymentForm.dataInicio === isoDate(o.period.inicio) && paymentForm.dataFim === isoDate(o.period.fim);
                          const pago = o.id === "mes" ? c.jaPago : paidInPeriod(emp, o.period);
                          return (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => fillPaymentForPeriod(emp, o.period, o.period.tipo)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer ${active ? "bg-[#3c63da] text-white border-[#3c63da]" : "bg-white text-[#152238] border-[#e5eaf1] hover:bg-[#f8faff]"}`}
                            >
                              {o.label}
                              <span className={`block text-[10px] font-semibold ${active ? "text-white/80" : "text-[#69778c]"}`}>
                                {brDate(o.period.inicio)} a {brDate(o.period.fim)}{pago > 0 ? ` · já pago ${formatBrl(pago)}` : ""}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-[#69778c] mb-1">De</label>
                        <input type="date" value={paymentForm.dataInicio} onChange={(e) => handleCustomRange(e.target.value, paymentForm.dataFim)} className="w-full rounded-xl border border-[#e5eaf1] px-2.5 py-2 text-xs font-semibold text-[#152238] bg-[#f8faff]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-[#69778c] mb-1">Até</label>
                        <input type="date" value={paymentForm.dataFim} onChange={(e) => handleCustomRange(paymentForm.dataInicio, e.target.value)} className="w-full rounded-xl border border-[#e5eaf1] px-2.5 py-2 text-xs font-semibold text-[#152238] bg-[#f8faff]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-[#69778c] mb-1">Dias de trabalho</label>
                        <input
                          type="number" min="0" max="31" value={paymentForm.dias}
                          onChange={(e) => {
                            const d = Math.max(0, parseInt(e.target.value || "0", 10));
                            const a = parseIso(paymentForm.dataInicio); const b = parseIso(paymentForm.dataFim);
                            const ex = b ? sumExtras(pendingExtras(emp, b)) : 0;
                            const v = Number((c.diaria * d + ex).toFixed(2));
                            setPaymentForm((p) => ({ ...p, dias: d, valorCalculado: v, valorAjustado: v }));
                          }}
                          className="w-full rounded-xl border border-[#e5eaf1] px-2.5 py-2 text-xs font-mono font-bold text-[#152238] bg-[#f8faff]"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-[#69778c] -mt-2">Os dias são contados pela escala da pessoa ({c.escala.map((d) => WEEKDAYS[d]).join(", ")}). Ajuste se houver folga, feriado ou falta.</p>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-[#69778c] mb-1">Valor a pagar (R$) *</label>
                        <input
                          type="number" step="0.01" min="0" required value={paymentForm.valorAjustado}
                          onChange={(e) => setPaymentForm((p) => ({ ...p, valorAjustado: parseFloat(e.target.value || "0") }))}
                          className="w-full rounded-xl border border-[#3c63da] px-3 py-2 text-sm font-mono font-extrabold text-[#3c63da] bg-[#edf2ff] focus:outline-none"
                        />
                        <span className="text-[10px] text-[#69778c] block mt-0.5">Calculado: {formatBrl2(paymentForm.valorCalculado)} ({paymentForm.dias} × {formatBrl2(c.diaria)}{(() => { const a = parseIso(paymentForm.dataInicio); const b = parseIso(paymentForm.dataFim); void a; const ex = b ? sumExtras(pendingExtras(emp, b)) : 0; return ex > 0 ? ` + ${formatBrl2(ex)} de Uber/extra a pagar` : ""; })()}, menos o que já foi pago no período)</span>
                        {(() => {
                          const a = parseIso(paymentForm.dataInicio); const b = parseIso(paymentForm.dataFim);
                          void a; const ex = b ? pendingExtras(emp, b) : [];
                          return ex.length ? (
                            <div className="mt-1.5 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[10px] text-amber-900 space-y-0.5">
                              <strong className="flex items-center gap-1"><Car className="h-3 w-3" /> Uber / extra incluído neste pagamento</strong>
                              {ex.map((x) => <div key={x.id} className="flex justify-between gap-2"><span>{extraLine(x)}</span><span className="font-mono font-bold">{formatBrl2(x.valor)}</span></div>)}
                            </div>
                          ) : null;
                        })()}
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-[#69778c] mb-1">Pago por</label>
                        <select
                          value={paymentForm.metodo}
                          onChange={(e) => setPaymentForm((p) => ({ ...p, metodo: e.target.value }))}
                          className="w-full rounded-xl border border-[#e5eaf1] px-3 py-2.5 text-xs font-bold text-[#152238] bg-[#f8faff]"
                        >
                          {PAYMENT_FORMS.map((f) => <option key={f.id} value={f.metodo}>{f.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                );
              })()}

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-[#69778c] mb-1">Observação no comprovante</label>
                <input
                  type="text"
                  placeholder="Ex.: adiantamento da 2ª semana"
                  value={paymentForm.observacao}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, observacao: e.target.value }))}
                  className="w-full rounded-xl border border-[#e5eaf1] px-3 py-2 text-xs font-semibold text-[#152238] bg-[#f8faff]"
                />
              </div>

              {onCreateEntry && (
                <label className="flex items-center gap-2 p-3 rounded-xl bg-[#f8faff] border border-[#e5eaf1] text-[#152238] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentForm.lancarDespesa}
                    onChange={(e) => setPaymentForm((p) => ({ ...p, lancarDespesa: e.target.checked }))}
                    className="rounded text-[#3c63da] h-4 w-4"
                  />
                  <div>
                    <span className="font-bold text-xs">Lançar também como despesa no financeiro</span>
                    <p className="text-[10px] text-[#69778c]">Cria a despesa "Vale Transporte" para conferir no extrato.</p>
                  </div>
                </label>
              )}
              </div>

              <div className="shrink-0 p-3.5 sm:p-4 border-t border-[#e5eaf1] flex items-center justify-end gap-2 bg-[#f8faff]">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="rounded-xl border border-[#e5eaf1] bg-white px-4 py-2 text-xs font-bold text-[#152238] hover:bg-[#f4f7fb] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isConfirmingPayment}
                  className="rounded-xl bg-[#3c63da] px-5 py-2 text-xs font-bold text-white hover:bg-[#2f52c0] shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                >
                  <FileCheck className="h-4 w-4" />
                  <span>{isConfirmingPayment ? "Registrando…" : "Registrar e gerar comprovante"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: TRANSPORTE EXTRA (UBER, 99, TÁXI…)                       */}
      {/* ------------------------------------------------------------- */}
      {extrasEmp && (() => {
        const lista = [...(extrasEmp.transportesExtras || [])].sort((a, b) => (b.data || "").localeCompare(a.data || ""));
        const mes = monthPeriod(hoje);
        const totalMes = extrasTotal(extrasEmp, mes);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-[#e5eaf1] w-full max-w-2xl max-h-[90vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="shrink-0 p-4 border-b border-[#e5eaf1] bg-[#f8faff] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Car className="h-5 w-5 text-[#3c63da] shrink-0" />
                  <h3 className="text-base font-extrabold text-[#152238] truncate">Transporte extra — {extrasEmp.nome}</h3>
                </div>
                <button type="button" onClick={() => setExtrasEmpId(null)} className="h-8 w-8 shrink-0 rounded-lg bg-white border border-[#e5eaf1] flex items-center justify-center text-[#69778c] hover:bg-[#f4f7fb] cursor-pointer" aria-label="Fechar">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
                <p className="text-[#69778c] leading-relaxed">
                  Use quando a empresa paga uma corrida fora do VT normal (ex.: Uber na volta para casa). O valor entra no VT do período da data da corrida e aparece no botão <strong>Pagar</strong>.
                </p>

                <form onSubmit={handleAddExtra} className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl border border-[#e5eaf1] bg-[#f8faff]">
                  <label className="flex flex-col gap-1 font-bold text-[#152238]">Data
                    <input type="date" required value={extraForm.data} onChange={(e) => setExtraForm((p) => ({ ...p, data: e.target.value }))} className="rounded-lg border border-[#e5eaf1] bg-white px-2 py-2 font-normal" />
                  </label>
                  <label className="flex flex-col gap-1 font-bold text-[#152238]">Transporte
                    <select value={extraForm.tipo} onChange={(e) => setExtraForm((p) => ({ ...p, tipo: e.target.value as VTTransporteExtra["tipo"] }))} className="rounded-lg border border-[#e5eaf1] bg-white px-2 py-2 font-normal">
                      {EXTRA_TRANSPORT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 font-bold text-[#152238]">Trajeto
                    <select value={extraForm.trajeto} onChange={(e) => setExtraForm((p) => ({ ...p, trajeto: e.target.value as VTTransporteExtra["trajeto"] }))} className="rounded-lg border border-[#e5eaf1] bg-white px-2 py-2 font-normal">
                      {EXTRA_ROUTES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 font-bold text-[#152238]">Valor (R$)
                    <input type="number" inputMode="decimal" step="0.01" min="0.01" required placeholder="0,00" value={extraForm.valor} onChange={(e) => setExtraForm((p) => ({ ...p, valor: e.target.value }))} className="rounded-lg border border-[#e5eaf1] bg-white px-2 py-2 font-normal font-mono" />
                  </label>
                  <label className="col-span-2 sm:col-span-3 flex flex-col gap-1 font-bold text-[#152238]">Motivo (opcional)
                    <input type="text" maxLength={120} placeholder="Ex.: saiu tarde do fechamento" value={extraForm.motivo} onChange={(e) => setExtraForm((p) => ({ ...p, motivo: e.target.value }))} className="rounded-lg border border-[#e5eaf1] bg-white px-2 py-2 font-normal" />
                  </label>
                  <div className="col-span-2 sm:col-span-1 flex items-end">
                    <button type="submit" disabled={savingExtra} className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-[#3c63da] text-white hover:bg-[#2f52c0] font-bold disabled:opacity-60 cursor-pointer">
                      <Plus className="h-3.5 w-3.5" /> {savingExtra ? "Salvando..." : "Incluir no VT"}
                    </button>
                  </div>
                </form>

                <div className="flex items-center justify-between rounded-xl border border-[#e5eaf1] px-3 py-2">
                  <span className="text-[#69778c]">Total extra em {mes.label.replace(/^Mês /, "")}</span>
                  <strong className="font-mono text-sm text-[#152238]">{formatBrl2(totalMes)}</strong>
                </div>

                {lista.length === 0 ? (
                  <div className="text-center text-[#69778c] py-6">Nenhum transporte extra lançado.</div>
                ) : (
                  <div className="divide-y divide-[#e5eaf1] rounded-xl border border-[#e5eaf1]">
                    {lista.map((x) => {
                      const d = parseIso(x.data);
                      return (
                        <div key={x.id} className="flex items-center justify-between gap-3 px-3 py-2">
                          <div className="min-w-0">
                            <div className="font-bold text-[#152238] flex flex-wrap items-center gap-1.5">{d ? `${brDate(d)}/${d.getFullYear()}` : x.data} · {extraTransportLabel(x.tipo)} · {extraRouteLabel(x.trajeto)}
                              {x.pagoEm
                                ? <span className="rounded-md bg-[#edf2ff] px-1.5 py-0.5 text-[10px] font-bold text-[#3c63da]">Pago em {(() => { const p = parseIso(x.pagoEm!); return p ? brDate(p) : x.pagoEm; })()}</span>
                                : <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">A pagar</span>}
                            </div>
                            {(x.motivo || x.registradoPor) && <div className="text-[11px] text-[#69778c] truncate">{[x.motivo, x.registradoPor && `lançado por ${x.registradoPor}`].filter(Boolean).join(" · ")}</div>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <strong className="font-mono text-[#152238]">{formatBrl2(x.valor)}</strong>
                            <button type="button" onClick={() => handleDeleteExtra(extrasEmp.id, x.id)} className="p-1.5 rounded-lg border border-[#e5eaf1] text-[#69778c] hover:text-red-600 hover:bg-red-50 cursor-pointer" title="Remover" aria-label="Remover transporte extra">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: HISTÓRICO DE PAGAMENTOS DO COLABORADOR                 */}
      {/* ------------------------------------------------------------- */}
      {isHistoryModalOpen && historyEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#e5eaf1] w-full max-w-2xl max-h-[90vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="shrink-0 p-4 border-b border-[#e5eaf1] bg-[#f8faff] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-[#3c63da]" />
                <h3 className="text-base font-extrabold text-[#152238]">
                  Histórico de Pagamentos — {historyEmp.nome}
                </h3>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="h-8 w-8 rounded-lg bg-white border border-[#e5eaf1] flex items-center justify-center text-[#69778c] hover:bg-[#f4f7fb] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              <div className="flex justify-between items-center p-3 rounded-xl bg-[#f8faff] border border-[#e5eaf1]">
                <div>Matrícula: <strong>{historyEmp.mat}</strong></div>
                <div>Setor: <strong>{historyEmp.setor}</strong></div>
                <div>Total Pago no Mês: <strong className="text-[#3c63da] font-mono">{formatBrl(historyEmp.quantoJaFoiPagoNoMes || 0)}</strong></div>
              </div>

              <div className="max-h-80 overflow-y-auto border border-[#e5eaf1] rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f8f9fc] text-[#69778c] uppercase text-[9px] border-b border-[#e5eaf1]">
                      <th className="p-2.5">Data</th>
                      <th className="p-2.5">Período / Referência</th>
                      <th className="p-2.5 text-center">Dias</th>
                      <th className="p-2.5 text-right">Valor Pago</th>
                      <th className="p-2.5 text-center">Método</th>
                      <th className="p-2.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5eaf1]">
                    {(!historyEmp.historicoPagamentos || historyEmp.historicoPagamentos.length === 0) ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-[#69778c]">
                          Nenhum recibo ou pagamento registrado para este colaborador.
                        </td>
                      </tr>
                    ) : (
                      historyEmp.historicoPagamentos.map((rec) => (
                        <tr key={rec.id} className="hover:bg-[#f8faff]">
                          <td className="p-2.5 font-mono text-[#152238] font-bold">{rec.data}</td>
                          <td className="p-2.5">
                            <div className="font-semibold text-[#152238]">{rec.periodoRef}</div>
                            {rec.observacao && <div className="text-[10px] text-[#69778c]">{rec.observacao}</div>}
                            {recordExtras(historyEmp, rec).map((x) => <div key={x.id} className="text-[10px] font-bold text-amber-800">+ {extraLine(x)}: {formatBrl2(x.valor)}</div>)}
                          </td>
                          <td className="p-2.5 text-center font-bold">{rec.dias} dias</td>
                          <td className="p-2.5 text-right font-mono font-bold text-[#3c63da]">{formatBrl(rec.valor)}</td>
                          <td className="p-2.5 text-center text-[10px] font-bold bg-[#edf2ff] text-[#3c63da] rounded-md">{rec.metodo || "PIX"}</td>
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setActiveReceiptRecord({ emp: historyEmp, record: rec });
                                  setIsHistoryModalOpen(false);
                                  setIsReceiptModalOpen(true);
                                }}
                                className="p-1 rounded bg-[#edf2ff] text-[#3c63da] hover:bg-[#3c63da] hover:text-white transition-colors cursor-pointer"
                                title="Ver / Imprimir Recibo"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePaymentRecord(historyEmp.id, rec.id)}
                                className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                                title="Excluir lançamento"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="shrink-0 p-3.5 sm:p-4 bg-[#f8faff] border-t border-[#e5eaf1] flex justify-end">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#152238] text-white font-bold text-xs cursor-pointer hover:bg-[#253654]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: COMPROVANTE FORMAL E RECIBO DE VALE TRANSPORTE (PDF)   */}
      {/* ------------------------------------------------------------- */}
      {isReceiptModalOpen && activeReceiptRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#e5eaf1] w-full max-w-2xl max-h-[90vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="shrink-0 p-3.5 sm:p-4 border-b border-[#e5eaf1] flex items-center justify-between bg-[#f8faff] print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-[#3c63da]" />
                <h3 className="text-base font-extrabold text-[#152238]">
                  Comprovante de Vale-Transporte
                </h3>
              </div>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="h-8 w-8 rounded-lg bg-white border border-[#e5eaf1] flex items-center justify-center text-[#69778c] hover:bg-[#f4f7fb] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Printable Document Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs text-[#152238] leading-relaxed bg-white">
              {/* Receipt Header */}
              <div className="flex justify-between items-start border-b-2 border-[#152238] pb-3">
                <div>
                  <h2 className="text-lg font-extrabold uppercase tracking-tight text-[#152238]">
                    Declaração e Recibo de Vale-Transporte
                  </h2>
                  <p className="text-[11px] text-[#69778c]">
                    Lei Federal nº 7.418/1985 e Decreto nº 95.247/1987
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#69778c] block">Unidade Franqueada</span>
                  <strong className="text-sm font-extrabold text-[#3c63da]">{unitLabel}</strong>
                  <div className="text-[10px] text-[#69778c]">Data: {activeReceiptRecord.record.data}</div>
                </div>
              </div>

              {/* Employee & Unit Information */}
              <div className="p-3.5 rounded-xl border border-[#e5eaf1] bg-[#f8f9fc] space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>Colaborador: <strong>{activeReceiptRecord.emp.nome}</strong></div>
                  <div>Matrícula: <strong>{activeReceiptRecord.emp.mat}</strong></div>
                  <div>Cargo / Setor: <strong>{activeReceiptRecord.emp.setor}</strong></div>
                  <div>Salário Base: <strong>{formatBrl(activeReceiptRecord.emp.salarioBase)}</strong></div>
                  <div>Operadora: <strong>{activeReceiptRecord.emp.operadora}</strong></div>
                  <div>Cartão Nº: <strong>{activeReceiptRecord.emp.cartaoNumero || "N/I"}</strong></div>
                </div>
              </div>

              {/* Payment Details Table */}
              <div className="border border-[#e5eaf1] rounded-xl p-4 space-y-2 bg-white">
                <div className="flex justify-between font-bold text-[#152238] border-b border-[#e5eaf1] pb-2">
                  <span>Período de Referência:</span>
                  <span className="text-[#3c63da]">{activeReceiptRecord.record.periodoRef}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dias Efetivos Beneficiados:</span>
                  <strong>{activeReceiptRecord.record.dias} dias úteis</strong>
                </div>
                <div className="flex justify-between">
                  <span>Valor por dia{activeReceiptRecord.emp.trechos?.length ? ` (${trechosResumo(activeReceiptRecord.emp.trechos)})` : " (ida + volta)"}:</span>
                  <strong>{formatBrl2(empDiaria(activeReceiptRecord.emp))}</strong>
                </div>
                {(() => {
                  const ex = recordExtras(activeReceiptRecord.emp, activeReceiptRecord.record);
                  if (!ex.length) return null;
                  const tot = ex.reduce((s2, x) => s2 + (Number(x.valor) || 0), 0);
                  const passagens = Math.max(0, activeReceiptRecord.record.valor - tot);
                  return (
                    <>
                      <div className="flex justify-between">
                        <span>Passagens ({activeReceiptRecord.record.dias} dias):</span>
                        <strong className="font-mono">{formatBrl2(passagens)}</strong>
                      </div>
                      <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 space-y-1">
                        <div className="flex justify-between font-bold text-amber-900">
                          <span>Transporte extra pago pela empresa ({ex.length}):</span>
                          <span className="font-mono">{formatBrl2(tot)}</span>
                        </div>
                        {ex.map((x) => (
                          <div key={x.id} className="flex justify-between gap-2 text-[11px] text-[#152238]">
                            <span>{extraLine(x)}</span>
                            <span className="font-mono">{formatBrl2(x.valor)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
                <div className="flex justify-between border-t border-[#e5eaf1] pt-1">
                  <span>Valor Total Entregue / Creditado neste Recibo:</span>
                  <strong className="text-[#3c63da] font-mono text-sm">{formatBrl2(activeReceiptRecord.record.valor)}</strong>
                </div>
                {activeReceiptRecord.record.descontoCltAbatido ? (
                  <div className="flex justify-between text-[#152238]">
                    <span>Desconto Proporcional CLT 6% em Folha:</span>
                    <strong className="font-mono text-sm">− {formatBrl(activeReceiptRecord.record.descontoCltAbatido)}</strong>
                  </div>
                ) : null}
                <div className="flex justify-between text-[#69778c] text-[10px]">
                  <span>Forma de Entrega:</span>
                  <span className="font-bold text-[#152238]">{activeReceiptRecord.record.metodo || "PIX"}</span>
                </div>
                <div className="flex justify-between text-[#69778c] text-[10px] gap-3">
                  <span>Destino:</span>
                  <span className="font-bold text-[#152238] text-right break-all">{paymentDestination(activeReceiptRecord.emp)}</span>
                </div>
              </div>

              {/* Legal Declaration Text */}
              <p className="text-[10px] text-[#69778c] italic text-justify leading-relaxed border-l-2 border-[#3c63da] pl-3 py-1 bg-[#f8faff]">
                "Declaro para os devidos fins legais ter recebido a quantia/crédito acima discriminada a título de Vale-Transporte, destinada exclusivamente ao meu deslocamento diário residência-trabalho e vice-versa, estando ciente de que o uso indevido do benefício constitui falta grave nos termos do artigo 7º, §3º do Decreto nº 95.247/1987."
              </p>

              {/* Signature Blocks */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-[#152238] pt-1">
                  <span className="font-bold block text-[#152238]">Franqueadora / Empregador</span>
                  <small className="text-[10px] text-[#69778c] block">{unitLabel}</small>
                </div>
                <div className="border-t border-[#152238] pt-1">
                  <span className="font-bold block text-[#152238]">Assinatura do Colaborador</span>
                  <small className="text-[10px] text-[#69778c] block">{activeReceiptRecord.emp.nome}</small>
                </div>
              </div>
            </div>

            {/* Enviar o termo por e-mail para o colaborador assinar */}
            <div className="shrink-0 px-3.5 sm:px-4 pt-3 bg-[#f8faff] border-t border-[#e5eaf1] print:hidden space-y-1.5">
              <label className="block text-[10px] font-extrabold uppercase text-[#69778c]">Enviar termo para assinatura por e-mail</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={receiptEmail}
                  onChange={(e) => setReceiptEmail(e.target.value)}
                  placeholder="e-mail do colaborador"
                  className="flex-1 rounded-xl border border-[#e5eaf1] bg-white px-3 py-2 text-xs font-semibold text-[#152238] focus:border-[#3c63da] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={sendReceiptByEmail}
                  className="px-4 py-2 rounded-xl bg-[#152238] text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-sm cursor-pointer hover:bg-[#0f1a2c]"
                >
                  <Mail className="h-4 w-4" />
                  <span>Enviar por e-mail</span>
                </button>
              </div>
              <p className="text-[10px] text-[#69778c]">Abre o seu e-mail com o termo já escrito. O colaborador responde "Li e concordo" ou devolve o PDF assinado. {receiptEmail ? "" : "O e-mail vem do cadastro de Funcionários quando estiver preenchido."}</p>
            </div>

            {/* Print Dialog Footer */}
            <div className="shrink-0 p-3.5 sm:p-4 bg-[#f8faff] flex justify-end gap-2 print:hidden">
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#e5eaf1] bg-white text-xs font-bold text-[#152238] cursor-pointer hover:bg-[#f4f7fb]"
              >
                Fechar
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-[#3c63da] text-xs font-bold text-white flex items-center gap-1.5 shadow-sm cursor-pointer hover:bg-[#2f52c0]"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimir Recibo (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADICIONAR / EDITAR COLABORADOR                         */}
      {/* ------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#e5eaf1] w-full max-w-2xl max-h-[92vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="shrink-0 p-4 sm:p-5 border-b border-[#e5eaf1] flex items-center justify-between bg-[#f8faff]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3c63da] text-white">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#152238]">
                    {editingEmployee ? "Editar colaborador do VT" : "Novo colaborador do VT"}
                  </h3>
                  <p className="text-xs text-[#69778c]">
                    Transportes, forma de pagamento e dias de trabalho.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="h-8 w-8 rounded-lg bg-white border border-[#e5eaf1] flex items-center justify-center text-[#69778c] hover:bg-[#f4f7fb] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="flex flex-col flex-1 overflow-hidden">
              {(() => {
                const trechos = empForm.trechos || [];
                const setTrecho = (id: string, patch: Partial<VTTrecho>) =>
                  setEmpForm((p) => ({ ...p, trechos: (p.trechos || []).map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
                const diaria = diariaFromTrechos(trechos);
                const escala = empForm.diasSemana?.length ? empForm.diasSemana : [];
                const diasEscala = monthWorkDays({ diasSemana: escala, diasPrevistos: 0 }, hoje, 0);
                const diasMes = empForm.diasManual ? Number(empForm.diasPrevistos) || 0 : diasEscala;
                const forma = empForm.formaPagamento || "cartao";
                const field = "w-full rounded-xl border border-[#e5eaf1] px-3 py-2 text-xs font-semibold text-[#152238] focus:border-[#3c63da] focus:outline-none bg-[#f8faff]";
                const label = "block text-[10px] font-extrabold uppercase text-[#69778c] mb-1";
                const section = "text-[11px] font-extrabold uppercase tracking-wider text-[#3c63da] pt-1";
                return (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
                {/* 1. Pessoa */}
                <div className={section}>1. Colaborador</div>
                {(!editingEmployee || !findStaff(editingEmployee)) && (
                  <div className="rounded-xl border border-[#c9d6f7] bg-[#f5f8ff] p-3 space-y-2">
                    <label className={label}>Funcionário cadastrado em {unitLabel} *</label>
                    {unitStaff.length === 0 ? (
                      <div className="text-[11px] text-[#152238]">
                        Nenhum funcionário cadastrado nesta unidade.{" "}
                        <button type="button" onClick={() => { setIsAddModalOpen(false); onNavigate("employees"); }} className="font-bold text-[#3c63da] underline cursor-pointer">Cadastrar em Funcionários</button>
                      </div>
                    ) : (
                      <select
                        value={empForm.employeeId || ""}
                        onChange={(e) => pickStaff(e.target.value)}
                        className={field.replace("bg-[#f8faff]", "bg-white")}
                      >
                        <option value="">Escolha o funcionário…</option>
                        {(editingEmployee ? unitStaff : staffWithoutVt).map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.nome}{person.matricula ? ` · Mat. ${person.matricula}` : ""}{person.cargo ? ` · ${person.cargo}` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                    {!editingEmployee && unitStaff.length > 0 && staffWithoutVt.length === 0 && (
                      <p className="text-[11px] text-[#69778c]">Todos os funcionários desta unidade já estão no VT.</p>
                    )}
                    <p className="text-[10px] text-[#69778c]">Nome, matrícula e função vêm do cadastro de Funcionários.</p>
                  </div>
                )}
                <div>
                  <label className={label}>Nome completo *</label>
                  <input required readOnly={Boolean(empForm.employeeId)} value={empForm.nome || ""} onChange={(e) => setEmpForm((p) => ({ ...p, nome: e.target.value }))} className={`${field} ${empForm.employeeId ? "opacity-70 cursor-not-allowed" : ""}`} placeholder="Escolha o funcionário acima" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={label}>Matrícula</label>
                    <input readOnly={Boolean(empForm.employeeId)} value={empForm.mat || ""} onChange={(e) => setEmpForm((p) => ({ ...p, mat: e.target.value }))} className={`${field} font-mono ${empForm.employeeId ? "opacity-70 cursor-not-allowed" : ""}`} placeholder="0045" />
                  </div>
                  <div>
                    <label className={label}>Setor / função</label>
                    <input readOnly={Boolean(empForm.employeeId)} value={empForm.setor || ""} onChange={(e) => setEmpForm((p) => ({ ...p, setor: e.target.value }))} className={`${field} ${empForm.employeeId ? "opacity-70 cursor-not-allowed" : ""}`} />
                  </div>
                  <div>
                    <label className={label}>Salário base (R$)</label>
                    <input type="number" step="0.01" min="0" value={empForm.salarioBase ?? 0} onChange={(e) => setEmpForm((p) => ({ ...p, salarioBase: parseFloat(e.target.value || "0") }))} className={`${field} font-mono`} />
                  </div>
                </div>

                {/* 2. Transporte */}
                <div className={section}>2. Transportes que usa por dia</div>
                <p className="text-[11px] text-[#69778c] -mt-2">Informe cada transporte e quantas passagens na ida e na volta. Ex.: 2 trens e 1 ônibus.</p>
                <div className="space-y-2">
                  <div className="hidden sm:grid grid-cols-[1.4fr_1fr_0.7fr_0.7fr_auto] gap-2 text-[10px] font-extrabold uppercase text-[#69778c] px-1">
                    <span>Transporte</span><span>Tarifa (R$)</span><span>Ida</span><span>Volta</span><span />
                  </div>
                  {trechos.map((t) => (
                    <div key={t.id} className="grid grid-cols-2 sm:grid-cols-[1.4fr_1fr_0.7fr_0.7fr_auto] gap-2 items-center rounded-xl sm:rounded-none border sm:border-0 border-[#e5eaf1] p-2 sm:p-0">
                      <select value={t.tipo} onChange={(e) => setTrecho(t.id, { tipo: e.target.value as VTTrecho["tipo"] })} className={`${field} col-span-2 sm:col-span-1`} aria-label="Tipo de transporte">
                        {TRANSPORT_TYPES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </select>
                      <input type="number" step="0.01" min="0" value={t.tarifa} onChange={(e) => setTrecho(t.id, { tarifa: parseFloat(e.target.value || "0") })} className={`${field} font-mono col-span-2 sm:col-span-1`} aria-label="Tarifa" placeholder="Tarifa" />
                      <label className="flex items-center gap-1 sm:block"><span className="sm:hidden text-[10px] font-bold text-[#69778c]">Ida</span>
                        <input type="number" min="0" max="10" value={t.ida} onChange={(e) => setTrecho(t.id, { ida: Math.max(0, parseInt(e.target.value || "0", 10)) })} className={`${field} font-mono`} aria-label="Passagens na ida" />
                      </label>
                      <label className="flex items-center gap-1 sm:block"><span className="sm:hidden text-[10px] font-bold text-[#69778c]">Volta</span>
                        <input type="number" min="0" max="10" value={t.volta} onChange={(e) => setTrecho(t.id, { volta: Math.max(0, parseInt(e.target.value || "0", 10)) })} className={`${field} font-mono`} aria-label="Passagens na volta" />
                      </label>
                      <button type="button" onClick={() => setEmpForm((p) => ({ ...p, trechos: (p.trechos || []).filter((x) => x.id !== t.id) }))} className="justify-self-end p-2 rounded-lg text-[#69778c] hover:text-red-600 hover:bg-red-50 cursor-pointer" title="Remover este transporte" aria-label="Remover transporte">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setEmpForm((p) => ({ ...p, trechos: [...(p.trechos || []), { id: "t_" + Date.now(), tipo: "onibus", tarifa: 5, ida: 1, volta: 1 }] }))} className="flex items-center gap-1.5 rounded-xl border border-dashed border-[#3c63da]/50 px-3 py-2 text-xs font-bold text-[#3c63da] hover:bg-[#edf2ff] cursor-pointer">
                    <Plus className="h-3.5 w-3.5" /> Adicionar transporte
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Operadora do cartão</label>
                    <select value={empForm.operadora || "Bilhete Único SP (SPTrans)"} onChange={(e) => setEmpForm((p) => ({ ...p, operadora: e.target.value }))} className={field}>
                      <option value="Bilhete Único SP (SPTrans)">Bilhete Único SP (SPTrans)</option>
                      <option value="Cartão TOP Metropolitano">Cartão TOP Metropolitano</option>
                      <option value="RioCard Mais / Ônibus">RioCard Mais / Ônibus</option>
                      <option value="Salvador Card">Salvador Card</option>
                      <option value="BHBUS / Transfácil">BHBUS / Transfácil</option>
                      <option value="Ônibus Intermunicipal">Ônibus Intermunicipal</option>
                      <option value="Sem cartão">Sem cartão</option>
                    </select>
                  </div>
                  <div>
                    <label className={label}>Número do cartão</label>
                    <input value={empForm.cartaoNumero || ""} onChange={(e) => setEmpForm((p) => ({ ...p, cartaoNumero: e.target.value }))} className={`${field} font-mono`} placeholder="Opcional" />
                  </div>
                </div>

                {/* 3. Como recebe */}
                <div className={section}>3. Como recebe o VT</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PAYMENT_FORMS.map((f) => (
                    <button key={f.id} type="button" onClick={() => setEmpForm((p) => ({ ...p, formaPagamento: f.id }))} className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${forma === f.id ? "bg-[#3c63da] text-white border-[#3c63da]" : "bg-white text-[#152238] border-[#e5eaf1] hover:bg-[#f8faff]"}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
                {forma === "pix" && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={label}>Tipo de chave</label>
                      <select value={empForm.pixTipo || "cpf"} onChange={(e) => setEmpForm((p) => ({ ...p, pixTipo: e.target.value as VTEmployeeItem["pixTipo"] }))} className={field}>
                        <option value="cpf">CPF</option><option value="celular">Celular</option><option value="email">E-mail</option><option value="aleatoria">Aleatória</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className={label}>Chave PIX *</label>
                      <input value={empForm.pixChave || ""} onChange={(e) => setEmpForm((p) => ({ ...p, pixChave: e.target.value }))} className={`${field} font-mono`} placeholder="Chave para receber" />
                    </div>
                  </div>
                )}
                {forma === "deposito" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="col-span-2">
                      <label className={label}>Banco *</label>
                      <input value={empForm.banco || ""} onChange={(e) => setEmpForm((p) => ({ ...p, banco: e.target.value }))} className={field} placeholder="Ex.: Caixa, Itaú, Nubank" />
                    </div>
                    <div>
                      <label className={label}>Agência</label>
                      <input value={empForm.agencia || ""} onChange={(e) => setEmpForm((p) => ({ ...p, agencia: e.target.value }))} className={`${field} font-mono`} />
                    </div>
                    <div>
                      <label className={label}>Conta *</label>
                      <input value={empForm.conta || ""} onChange={(e) => setEmpForm((p) => ({ ...p, conta: e.target.value }))} className={`${field} font-mono`} />
                    </div>
                    <div className="col-span-2">
                      <label className={label}>Tipo de conta</label>
                      <select value={empForm.tipoConta || "corrente"} onChange={(e) => setEmpForm((p) => ({ ...p, tipoConta: e.target.value as VTEmployeeItem["tipoConta"] }))} className={field}>
                        <option value="corrente">Corrente</option><option value="poupanca">Poupança</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 4. Dias e período */}
                <div className={section}>4. Dias de trabalho e período de pagamento</div>
                <div>
                  <label className={label}>Paga o VT</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PERIODICITIES.map((o) => (
                      <button key={o.id} type="button" onClick={() => setEmpForm((p) => ({ ...p, periodicidade: o.id }))} className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${(empForm.periodicidade || "mensal") === o.id ? "bg-[#152238] text-white border-[#152238]" : "bg-white text-[#152238] border-[#e5eaf1] hover:bg-[#f8faff]"}`}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={label}>Dias da semana que trabalha</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                      const on = escala.includes(d);
                      return (
                        <button key={d} type="button" onClick={() => setEmpForm((p) => {
                          const atual = p.diasSemana || [];
                          return { ...p, diasSemana: on ? atual.filter((x) => x !== d) : [...atual, d].sort() };
                        })} className={`h-9 w-11 rounded-lg text-xs font-bold border cursor-pointer ${on ? "bg-[#3c63da] text-white border-[#3c63da]" : "bg-white text-[#69778c] border-[#e5eaf1]"}`}>
                          {WEEKDAYS[d]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Dias no mês</label>
                    {empForm.diasManual ? (
                      <input type="number" min="0" max="31" value={empForm.diasPrevistos ?? 0} onChange={(e) => setEmpForm((p) => ({ ...p, diasPrevistos: parseInt(e.target.value || "0", 10) }))} className={`${field} font-mono`} />
                    ) : (
                      <div className={`${field} font-mono bg-white`}>{diasEscala} dias (pela escala)</div>
                    )}
                    <label className="mt-1 flex items-center gap-1.5 text-[10px] text-[#69778c] cursor-pointer">
                      <input type="checkbox" checked={Boolean(empForm.diasManual)} onChange={(e) => setEmpForm((p) => ({ ...p, diasManual: e.target.checked, diasPrevistos: e.target.checked ? diasEscala : p.diasPrevistos }))} />
                      Digitar os dias à mão (escala diferente, folgas)
                    </label>
                  </div>
                  <div>
                    <label className={label}>Faltas no mês</label>
                    <input type="number" min="0" max="31" value={empForm.faltas ?? 0} onChange={(e) => setEmpForm((p) => ({ ...p, faltas: parseInt(e.target.value || "0", 10) }))} className={`${field} font-mono`} />
                  </div>
                </div>
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-amber-900">
                    <strong className="flex items-center gap-1"><Car className="h-3.5 w-3.5" /> Uber, 99, táxi pagos pela empresa</strong>
                    {editingEmployee
                      ? <span>{(editingEmployee.transportesExtras || []).length} corrida(s) lançada(s). Cada corrida entra no VT do período da data.</span>
                      : <span>Salve o colaborador e depois use o botão <strong>Uber / extra</strong> na linha dele.</span>}
                  </div>
                  {editingEmployee && (
                    <button type="button" onClick={() => { const emp = editingEmployee; setIsAddModalOpen(false); setEditingEmployee(null); openExtrasModal(emp); }} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 font-bold text-xs cursor-pointer">
                      <Plus className="h-3.5 w-3.5" /> Lançar corrida
                    </button>
                  )}
                </div>
                <div>
                  <label className={label}>Valor fixo de mobilidade todo mês (R$, opcional)</label>
                  <input type="number" step="0.01" min="0" value={empForm.uberAdicional ?? 0} onChange={(e) => setEmpForm((p) => ({ ...p, uberAdicional: parseFloat(e.target.value || "0") }))} className={`${field} font-mono`} />
                </div>

                {/* Resumo */}
                <div className="p-3 bg-[#f8faff] rounded-xl border border-[#e5eaf1] grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-[10px] font-extrabold uppercase text-[#69778c]">Por dia</div>
                    <strong className="text-sm font-mono text-[#152238]">{formatBrl2(diaria)}</strong>
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold uppercase text-[#69778c]">No mês</div>
                    <strong className="text-sm font-mono text-[#152238]">{formatBrl(diaria * Math.max(0, diasMes - (empForm.faltas || 0)) + (empForm.uberAdicional || 0))}</strong>
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold uppercase text-[#69778c]">Desconto máx. (6%)</div>
                    <strong className="text-sm font-mono text-[#152238]">{formatBrl((empForm.salarioBase || 0) * 0.06)}</strong>
                  </div>
                </div>
              </div>
                );
              })()}

              {notice && notice.kind !== "ok" && (
                <div role="alert" className={`shrink-0 mx-3.5 sm:mx-4 mb-2 rounded-xl border px-3 py-2 text-xs font-semibold ${notice.kind === "erro" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-300 bg-amber-50 text-amber-900"}`}>
                  <strong>{notice.title}:</strong> {notice.text}
                </div>
              )}
              <div className="shrink-0 p-3.5 sm:p-4 border-t border-[#e5eaf1] flex items-center justify-end gap-2 bg-[#f8faff]">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-xl border border-[#e5eaf1] bg-white px-4 py-2 text-xs font-bold text-[#152238] hover:bg-[#f4f7fb] cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="rounded-xl bg-[#3c63da] px-5 py-2 text-xs font-bold text-white hover:bg-[#2f52c0] shadow-sm cursor-pointer">
                  {editingEmployee ? "Salvar alterações" : "Cadastrar colaborador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: AJUSTAR DIAS ÚTEIS EM LOTE                             */}
      {/* ------------------------------------------------------------- */}
      {isBatchDaysModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#e5eaf1] w-full max-w-sm max-h-[90vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="shrink-0 p-4 border-b border-[#e5eaf1] bg-[#f8faff] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#152238] flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#3c63da]" />
                <span>Mesma quantidade de dias para vários</span>
              </h3>
              <button
                onClick={() => setIsBatchDaysModalOpen(false)}
                className="h-7 w-7 rounded-lg bg-white border border-[#e5eaf1] flex items-center justify-center text-[#69778c] hover:bg-[#f4f7fb] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <p className="text-[#69778c]">
                Quantos dias de trabalho no mês?
              </p>

              <div className="grid grid-cols-4 gap-2">
                {[20, 21, 22, 26].map((d) => (
                  <button
                    key={d}
                    onClick={() => setBatchDaysValue(d)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      batchDaysValue === d
                        ? "bg-[#3c63da] text-white border-[#3c63da] shadow-xs"
                        : "bg-[#f8faff] text-[#152238] border-[#e5eaf1] hover:border-[#3c63da]"
                    }`}
                  >
                    {d} dias
                  </button>
                ))}
              </div>

              <label className="flex items-start gap-2 p-2.5 rounded-xl bg-[#f8faff] border border-[#e5eaf1] cursor-pointer">
                <input type="checkbox" checked={batchKeepCustom} onChange={(e) => setBatchKeepCustom(e.target.checked)} className="mt-0.5" />
                <span>
                  <strong className="text-[#152238]">Não mexer em quem tem escala própria</strong>
                  <span className="block text-[10px] text-[#69778c]">{employees.filter(hasOwnSchedule).length} colaborador(es) com dias diferentes de seg–sex continuam como estão.</span>
                </span>
              </label>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-[#69778c] mb-1">
                  Ou digite quantidade personalizada:
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={batchDaysValue}
                  onChange={(e) => setBatchDaysValue(parseInt(e.target.value || "22", 10))}
                  className="w-full rounded-xl border border-[#e5eaf1] px-3 py-2 text-xs font-mono font-bold text-[#152238] bg-[#f8faff]"
                />
              </div>
            </div>

            <div className="shrink-0 p-3.5 sm:p-4 border-t border-[#e5eaf1] flex items-center justify-end gap-2 bg-[#f8faff]">
              <button
                onClick={() => setIsBatchDaysModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[#e5eaf1] bg-white text-xs font-bold text-[#152238] hover:bg-[#f4f7fb]"
              >
                Cancelar
              </button>
              <button
                onClick={applyBatchDays}
                className="px-4 py-1.5 rounded-lg bg-[#3c63da] text-xs font-bold text-white shadow-xs hover:bg-[#2f52c0]"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
      {notice && (
        <div role="status" aria-live="polite" className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[380px] z-[70] rounded-2xl border shadow-2xl p-4 flex items-start gap-3 print:hidden ${notice.kind === "ok" ? "bg-[#152238] border-[#152238] text-white" : notice.kind === "erro" ? "bg-red-600 border-red-700 text-white" : "bg-amber-50 border-amber-300 text-amber-900"}`}>
          {notice.kind === "ok" ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[#8fb0ff]" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-extrabold">{notice.title}</div>
            <div className="text-xs opacity-90">{notice.text}</div>
          </div>
          <button onClick={() => setNotice(null)} className="opacity-70 hover:opacity-100 cursor-pointer" aria-label="Fechar aviso"><X className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
};
