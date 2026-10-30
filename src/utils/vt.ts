import type { VTEmployeeItem, VTTransporteExtra, VTTrecho } from "../types";

/** Regras do Vale-Transporte: trechos, escala de dias, períodos (semana/quinzena/mês) e formas de pagamento. */

export const TRANSPORT_TYPES: { id: VTTrecho["tipo"]; label: string }[] = [
  { id: "onibus", label: "Ônibus" },
  { id: "trem", label: "Trem" },
  { id: "metro", label: "Metrô" },
  { id: "brt", label: "BRT / Corredor" },
  { id: "intermunicipal", label: "Ônibus intermunicipal" },
  { id: "van", label: "Van / Lotação" },
  { id: "barca", label: "Barca" },
  { id: "integracao", label: "Integração" },
  { id: "outro", label: "Outro" },
];
export const transportLabel = (tipo?: string) => TRANSPORT_TYPES.find((t) => t.id === tipo)?.label || "Transporte";

export const PAYMENT_FORMS: { id: NonNullable<VTEmployeeItem["formaPagamento"]>; label: string; metodo: string }[] = [
  { id: "pix", label: "PIX", metodo: "PIX" },
  { id: "deposito", label: "Depósito em conta", metodo: "Depósito em conta" },
  { id: "cartao", label: "Recarga no cartão", metodo: "Recarga no cartão" },
  { id: "dinheiro", label: "Dinheiro", metodo: "Dinheiro" },
];
export const paymentFormLabel = (id?: string) => PAYMENT_FORMS.find((f) => f.id === id)?.label || "Recarga no cartão";

export const PERIODICITIES: { id: NonNullable<VTEmployeeItem["periodicidade"]>; label: string }[] = [
  { id: "semanal", label: "Semanal" },
  { id: "quinzenal", label: "Quinzenal" },
  { id: "mensal", label: "Mensal" },
];

export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const DEFAULT_SCHEDULE = [1, 2, 3, 4, 5];

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Valor de um dia de trabalho: soma de (viagens de ida + volta) × tarifa de cada transporte. */
export function diariaFromTrechos(trechos: VTTrecho[] = []): number {
  return round2(trechos.reduce((sum, t) => sum + ((Number(t.ida) || 0) + (Number(t.volta) || 0)) * (Number(t.tarifa) || 0), 0));
}
export function idaVoltaFromTrechos(trechos: VTTrecho[] = []) {
  return {
    ida: round2(trechos.reduce((s, t) => s + (Number(t.ida) || 0) * (Number(t.tarifa) || 0), 0)),
    volta: round2(trechos.reduce((s, t) => s + (Number(t.volta) || 0) * (Number(t.tarifa) || 0), 0)),
  };
}
export function empDiaria(emp: Pick<VTEmployeeItem, "trechos" | "tarifaIda" | "tarifaVolta">): number {
  return emp.trechos?.length ? diariaFromTrechos(emp.trechos) : round2((emp.tarifaIda || 0) + (emp.tarifaVolta || 0));
}
/** Ex.: "2 trem · 1 ônibus" (contando ida e volta). */
export function trechosResumo(trechos: VTTrecho[] = []): string {
  return trechos
    .filter((t) => (t.ida || 0) + (t.volta || 0) > 0)
    .map((t) => `${(t.ida || 0) + (t.volta || 0)} ${transportLabel(t.tipo).toLowerCase()}`)
    .join(" · ");
}

/* ---------- Datas ---------- */

const pad = (n: number) => String(n).padStart(2, "0");
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseIso = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const br = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(s || "");
  if (br) return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));
  return null;
};
export const brDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;

/** Quantos dias a pessoa trabalha entre duas datas (inclusive), pelos dias da semana da escala. */
export function workingDaysBetween(start: Date, end: Date, schedule: number[] = DEFAULT_SCHEDULE): number {
  if (!schedule.length || end < start) return 0;
  let count = 0;
  const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (d <= last) {
    if (schedule.includes(d.getDay())) count += 1;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export interface Period { inicio: Date; fim: Date; label: string; tipo: "semana" | "quinzena_1" | "quinzena_2" | "mes" | "outro" }

export function monthPeriod(ref: Date): Period {
  const inicio = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const fim = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  return { inicio, fim, tipo: "mes", label: `Mês (${brDate(inicio)} a ${brDate(fim)})` };
}
export function weekPeriod(ref: Date): Period {
  const day = ref.getDay();
  const inicio = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - ((day + 6) % 7)); // segunda
  const fim = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6);
  return { inicio, fim, tipo: "semana", label: `Semana ${brDate(inicio)} a ${brDate(fim)}` };
}
export function fortnightPeriod(ref: Date): Period {
  if (ref.getDate() <= 15) {
    const inicio = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const fim = new Date(ref.getFullYear(), ref.getMonth(), 15);
    return { inicio, fim, tipo: "quinzena_1", label: `1ª quinzena (${brDate(inicio)} a ${brDate(fim)})` };
  }
  const inicio = new Date(ref.getFullYear(), ref.getMonth(), 16);
  const fim = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  return { inicio, fim, tipo: "quinzena_2", label: `2ª quinzena (${brDate(inicio)} a ${brDate(fim)})` };
}
export function periodFor(periodicidade: VTEmployeeItem["periodicidade"], ref: Date): Period {
  if (periodicidade === "semanal") return weekPeriod(ref);
  if (periodicidade === "quinzenal") return fortnightPeriod(ref);
  return monthPeriod(ref);
}
export function nextPeriod(period: Period, periodicidade: VTEmployeeItem["periodicidade"]): Period {
  const after = new Date(period.fim.getFullYear(), period.fim.getMonth(), period.fim.getDate() + 1);
  return periodFor(periodicidade, after);
}

/** Dias de trabalho do colaborador no mês: escala própria, ou número digitado à mão. */
export function monthWorkDays(emp: Pick<VTEmployeeItem, "diasSemana" | "diasManual" | "diasPrevistos">, ref: Date, fallback: number): number {
  if (emp.diasManual) return Number(emp.diasPrevistos) || 0;
  if (emp.diasSemana?.length) {
    const m = monthPeriod(ref);
    return workingDaysBetween(m.inicio, m.fim, emp.diasSemana);
  }
  return Number(emp.diasPrevistos) || fallback;
}

/** Quanto já foi pago para pagamentos que começam dentro do período. */
export function paidInPeriod(emp: Pick<VTEmployeeItem, "historicoPagamentos">, period: Period): number {
  return round2((emp.historicoPagamentos || []).reduce((sum, r) => {
    const d = parseIso(r.dataInicio || "") || parseIso(r.data || "");
    return d && d >= period.inicio && d <= period.fim ? sum + (r.valor || 0) : sum;
  }, 0));
}

/** Texto de para onde vai o dinheiro (PIX, conta ou cartão). */
export function paymentDestination(emp: VTEmployeeItem): string {
  const forma = emp.formaPagamento || "cartao";
  if (forma === "pix") return emp.pixChave ? `PIX ${emp.pixTipo ? `(${emp.pixTipo}) ` : ""}${emp.pixChave}` : "PIX (chave não informada)";
  if (forma === "deposito") {
    const parts = [emp.banco, emp.agencia && `ag. ${emp.agencia}`, emp.conta && `conta ${emp.conta}`, emp.tipoConta === "poupanca" ? "poupança" : emp.conta ? "corrente" : ""].filter(Boolean);
    return parts.length ? parts.join(" · ") : "Conta não informada";
  }
  if (forma === "dinheiro") return "Em mãos";
  return `${emp.operadora || "Cartão"}${emp.cartaoNumero ? ` · ${emp.cartaoNumero}` : ""}`;
}

/* ---------- Transporte extra (Uber, 99, táxi…) pago pela empresa ---------- */

export const EXTRA_TRANSPORT_TYPES: { id: VTTransporteExtra["tipo"]; label: string }[] = [
  { id: "uber", label: "Uber" },
  { id: "99", label: "99" },
  { id: "taxi", label: "Táxi" },
  { id: "onibus_extra", label: "Passagem extra" },
  { id: "outro", label: "Outro" },
];
export const extraTransportLabel = (tipo?: string) => EXTRA_TRANSPORT_TYPES.find((t) => t.id === tipo)?.label || "Transporte extra";

export const EXTRA_ROUTES: { id: VTTransporteExtra["trajeto"]; label: string }[] = [
  { id: "volta", label: "Volta para casa" },
  { id: "ida", label: "Ida para o trabalho" },
  { id: "ida_volta", label: "Ida e volta" },
];
export const extraRouteLabel = (id?: string) => EXTRA_ROUTES.find((r) => r.id === id)?.label || "Volta para casa";

/** Corridas extras com data dentro do período. */
export function extrasInPeriod(emp: Pick<VTEmployeeItem, "transportesExtras">, period: { inicio: Date; fim: Date }): VTTransporteExtra[] {
  return (emp.transportesExtras || []).filter((x) => {
    const d = parseIso(x.data || "");
    return !!d && d >= period.inicio && d <= period.fim;
  });
}
/** Soma das corridas extras no período. */
export function extrasTotal(emp: Pick<VTEmployeeItem, "transportesExtras">, period: { inicio: Date; fim: Date }): number {
  return round2(extrasInPeriod(emp, period).reduce((s, x) => s + (Number(x.valor) || 0), 0));
}

/** Corridas ainda não pagas com data até o fim do período (as atrasadas também entram). */
export function pendingExtras(emp: Pick<VTEmployeeItem, "transportesExtras">, until: Date): VTTransporteExtra[] {
  return (emp.transportesExtras || [])
    .filter((x) => !x.pagoEm)
    .filter((x) => { const d = parseIso(x.data || ""); return !!d && d <= until; })
    .sort((a, b) => (a.data || "").localeCompare(b.data || ""));
}
export const sumExtras = (list: VTTransporteExtra[]) => round2(list.reduce((s, x) => s + (Number(x.valor) || 0), 0));

/** Quanto das passagens (sem corridas extras) já foi pago em pagamentos que começam no período. */
export function paidPassagensInPeriod(emp: Pick<VTEmployeeItem, "historicoPagamentos">, period: { inicio: Date; fim: Date }): number {
  return round2((emp.historicoPagamentos || []).reduce((sum, r) => {
    const d = parseIso(r.dataInicio || "") || parseIso(r.data || "");
    if (!d || d < period.inicio || d > period.fim) return sum;
    const passagens = r.valorPassagens ?? Math.max(0, (r.valor || 0) - (r.valorExtras || 0));
    return sum + passagens;
  }, 0));
}
