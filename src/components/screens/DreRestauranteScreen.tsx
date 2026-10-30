import React, { useState, useMemo } from "react";
import {
  DreRestauranteParams,
  ManualEntry,
  BillItem,
  PaymentMethod,
} from "../../types";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  Landmark,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Info,
  Target,
  DollarSign,
  Percent,
} from "lucide-react";

interface DreRestauranteScreenProps {
  dreParams: DreRestauranteParams;
  manualEntries: ManualEntry[];
  bills: BillItem[];
  paymentMethods: PaymentMethod[];
  onSaveDreParams: (p: DreRestauranteParams) => Promise<void>;
}

const DEFAULT_PARAMS: DreRestauranteParams = {
  cmvPct: 32,
  cmoPct: 28,
  depreciacao: 0,
  amortizacao: 0,
  juros: 0,
  impostoRenda: 0,
};

function formatBrl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return (part / total) * 100;
}

function PctBar({ value, target, color }: { value: number; target: number; color: string }) {
  const w = Math.min(100, value);
  const over = value > target;
  return (
    <div className="relative h-2 w-full rounded-full bg-[#f1f5f9] overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${over ? "bg-red-400" : color}`}
        style={{ width: `${w}%` }}
      />
      {/* target marker */}
      <div
        className="absolute top-0 h-2 w-0.5 bg-[#94a3b8]"
        style={{ left: `${Math.min(100, target)}%` }}
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  valuePct,
  targetPct,
  icon: Icon,
  color,
  info,
}: {
  label: string;
  value: number;
  valuePct: number;
  targetPct: number;
  icon: React.ElementType;
  color: string;
  info?: string;
}) {
  const over = valuePct > targetPct;
  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        {info && (
          <div className="group relative">
            <Info className="h-3.5 w-3.5 text-[#94a3b8] cursor-help" />
            <div className="absolute right-0 top-5 z-10 hidden group-hover:block w-52 rounded-xl border border-[#e2e8f0] bg-white p-3 text-[10px] text-[#475569] shadow-lg">
              {info}
            </div>
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-extrabold uppercase text-[#94a3b8]">{label}</p>
        <p className="text-xl font-extrabold text-[#0f172a]">{formatBrl(value)}</p>
        <p className={`text-xs font-bold mt-0.5 ${over ? "text-red-500" : "text-emerald-600"}`}>
          {valuePct.toFixed(1)}% do faturamento
          {over ? <TrendingUp className="inline ml-1 h-3 w-3" /> : <TrendingDown className="inline ml-1 h-3 w-3" />}
        </p>
      </div>
      <PctBar value={valuePct} target={targetPct} color="bg-emerald-400" />
      <p className="text-[9px] text-[#94a3b8]">Meta: {targetPct.toFixed(0)}%</p>
    </div>
  );
}

export const DreRestauranteScreen: React.FC<DreRestauranteScreenProps> = ({
  dreParams,
  manualEntries,
  bills,
  paymentMethods,
  onSaveDreParams,
}) => {
  const params = { ...DEFAULT_PARAMS, ...dreParams };
  const [editingParams, setEditingParams] = useState(false);
  const [localParams, setLocalParams] = useState(params);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [showExtrato, setShowExtrato] = useState(false);

  // Filtrar entradas do mês selecionado
  const entriesInMonth = useMemo(
    () =>
      manualEntries.filter((e) => {
        const d = (e.date || "").substring(0, 7);
        return d === selectedMonth && !e.excludedFromDre && !e.isIntercompany;
      }),
    [manualEntries, selectedMonth]
  );

  const billsInMonth = useMemo(
    () =>
      bills.filter((b) => {
        const d = (b.vencimento || "").substring(0, 7);
        return d === selectedMonth;
      }),
    [bills, selectedMonth]
  );

  // Faturamento bruto = entradas do tipo "entrada"
  const faturamentoBruto = useMemo(
    () => entriesInMonth.filter((e) => e.type === "entrada").reduce((s, e) => s + e.value, 0),
    [entriesInMonth]
  );

  // Despesas totais = saídas + bills
  const despesasEntradas = useMemo(
    () => entriesInMonth.filter((e) => e.type === "despesa").reduce((s, e) => s + e.value, 0),
    [entriesInMonth]
  );
  const despesasBills = useMemo(
    () => billsInMonth.reduce((s, b) => s + b.value, 0),
    [billsInMonth]
  );
  const totalDespesas = despesasEntradas + despesasBills;

  // Taxas de cartão (payment methods fees)
  const taxasCartao = useMemo(() => {
    const total = paymentMethods.reduce((s, pm) => {
      const feeDecimal = pm.fee / 100;
      return s + faturamentoBruto * feeDecimal * 0.3; // estimativa 30% do faturamento via cartão
    }, 0);
    return total;
  }, [paymentMethods, faturamentoBruto]);

  // CMV real (usando parâmetro % sobre faturamento)
  const cmvReal = faturamentoBruto * (params.cmvPct / 100);
  const cmvRealPct = pct(cmvReal, faturamentoBruto);

  // CMO real
  const cmoReal = faturamentoBruto * (params.cmoPct / 100);
  const cmoRealPct = pct(cmoReal, faturamentoBruto);

  // Impostos estimados (simpleconacional / lucro presumido)
  const impostosEstimados = faturamentoBruto * 0.065; // 6.5% Simples/alimentação

  // Lucro Bruto = Fat - CMV - Impostos - Taxas
  const lucroBruto = faturamentoBruto - cmvReal - impostosEstimados - taxasCartao;
  const lucroBrutoPct = pct(lucroBruto, faturamentoBruto);

  // EBIT = Lucro Bruto - CMO - Demais Despesas
  const outrosDespesas = totalDespesas - cmvReal - cmoReal;
  const ebit = lucroBruto - cmoReal - Math.max(0, outrosDespesas);
  const ebitPct = pct(ebit, faturamentoBruto);

  // EBITDA = EBIT + Depreciação + Amortização
  const ebitda = ebit + params.depreciacao + params.amortizacao;
  const ebitdaPct = pct(ebitda, faturamentoBruto);

  // Lucro Líquido
  const lucroLiquido = ebitda - params.juros - params.impostoRenda;
  const lucroLiquidoPct = pct(lucroLiquido, faturamentoBruto);

  // Benchmarks setor (referência: ABRASEL)
  const benchmarks = {
    cmv: 32,
    cmo: 28,
    ebitda: 12,
    margemLiquida: 5,
  };

  // Meses disponíveis
  const monthsAvailable = useMemo(() => {
    const set = new Set<string>();
    manualEntries.forEach((e) => {
      const m = (e.date || "").substring(0, 7);
      if (m) set.add(m);
    });
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return Array.from(set).sort().reverse();
  }, [manualEntries]);

  async function handleSaveParams() {
    setIsSaving(true);
    try {
      await onSaveDreParams(localParams);
      setEditingParams(false);
    } finally {
      setIsSaving(false);
    }
  }

  const DreRow = ({
    label,
    value,
    valuePct: vp,
    bold,
    indent,
    positive,
    separator,
  }: {
    label: string;
    value: number;
    valuePct?: number;
    bold?: boolean;
    indent?: boolean;
    positive?: boolean;
    separator?: boolean;
  }) => (
    <tr className={`${separator ? "border-t-2 border-[#e2e8f0]" : ""}`}>
      <td className={`py-1.5 ${indent ? "pl-6" : "pl-2"} text-xs ${bold ? "font-extrabold text-[#0f172a]" : "text-[#475569]"}`}>
        {label}
      </td>
      <td className={`py-1.5 pr-2 text-right text-xs font-mono ${bold ? "font-extrabold" : ""} ${value < 0 ? "text-red-500" : positive !== false ? "text-[#0f172a]" : "text-[#475569]"}`}>
        {formatBrl(value)}
      </td>
      <td className={`py-1.5 pr-2 text-right text-[10px] ${vp !== undefined ? (vp < 0 ? "text-red-400" : "text-[#94a3b8]") : "text-transparent"}`}>
        {vp !== undefined ? `${vp.toFixed(1)}%` : "—"}
      </td>
    </tr>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-[#0f172a] flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#2563eb]" />
            DRE Restaurante
          </h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            CMV · CMO · EBITDA · Resultado Operacional
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-xs focus:outline-none"
          >
            {monthsAvailable.map((m) => {
              const [y, mo] = m.split("-");
              const label = new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
              return <option key={m} value={m}>{label}</option>;
            })}
          </select>
          <button
            onClick={() => { setEditingParams(!editingParams); setLocalParams(params); }}
            className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-bold text-[#475569] hover:bg-[#f8fafc]"
          >
            <Target className="h-3.5 w-3.5" />
            Parâmetros
          </button>
        </div>
      </div>

      {/* Painel parâmetros */}
      {editingParams && (
        <div className="rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-[#1d4ed8]">Parâmetros do DRE</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {([
              ["cmvPct", "CMV % (meta)", "%"],
              ["cmoPct", "CMO % (meta)", "%"],
              ["depreciacao", "Depreciação Mensal", "R$"],
              ["amortizacao", "Amortização Mensal", "R$"],
              ["juros", "Juros/Financiamentos", "R$"],
              ["impostoRenda", "IR/CSLL", "R$"],
            ] as [keyof DreRestauranteParams, string, string][]).map(([key, label, unit]) => (
              <div key={key}>
                <label className="text-[9px] font-extrabold uppercase text-[#4f6fae] mb-1 block">{label}</label>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#4f6fae] font-bold">{unit}</span>
                  <input
                    type="number"
                    min={0}
                    step={key.endsWith("Pct") ? 0.5 : 100}
                    value={localParams[key]}
                    onChange={(e) => setLocalParams((p) => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-[#bfdbfe] bg-white px-2 py-1.5 text-xs focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSaveParams}
              disabled={isSaving}
              className="rounded-lg bg-[#2563eb] px-4 py-2 text-xs font-bold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {isSaving ? "Salvando…" : "Salvar Parâmetros"}
            </button>
            <button
              onClick={() => setEditingParams(false)}
              className="rounded-lg border border-[#e2e8f0] px-4 py-2 text-xs font-bold text-[#64748b] hover:bg-[#f1f5f9]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* KPIs principais */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Faturamento Bruto"
          value={faturamentoBruto}
          valuePct={100}
          targetPct={100}
          icon={DollarSign}
          color="bg-blue-50 text-blue-600"
        />
        <KpiCard
          label="CMV"
          value={cmvReal}
          valuePct={cmvRealPct}
          targetPct={benchmarks.cmv}
          icon={ShoppingCart}
          color="bg-amber-50 text-amber-600"
          info="Custo de Mercadoria Vendida. Meta ABRASEL: até 32%."
        />
        <KpiCard
          label="CMO"
          value={cmoReal}
          valuePct={cmoRealPct}
          targetPct={benchmarks.cmo}
          icon={Users}
          color="bg-purple-50 text-purple-600"
          info="Custo de Mão de Obra. Meta ABRASEL: até 28%."
        />
        <KpiCard
          label="EBITDA"
          value={ebitda}
          valuePct={ebitdaPct}
          targetPct={benchmarks.ebitda}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
          info="Lucro antes de juros, impostos, depreciação e amortização. Meta: acima de 12%."
        />
      </div>

      {/* DRE completo */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f1f5f9]">
          <h3 className="text-sm font-extrabold text-[#0f172a]">Demonstrativo de Resultado</h3>
          <span className="text-xs text-[#64748b]">% sobre Faturamento Bruto</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8fafc]">
              <tr>
                <th className="pl-2 py-2 text-left text-[9px] font-extrabold uppercase text-[#94a3b8]">Conta</th>
                <th className="pr-2 py-2 text-right text-[9px] font-extrabold uppercase text-[#94a3b8]">Valor</th>
                <th className="pr-2 py-2 text-right text-[9px] font-extrabold uppercase text-[#94a3b8]">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f8fafc]">
              <DreRow label="(+) Faturamento Bruto" value={faturamentoBruto} valuePct={100} bold />
              <DreRow label="(-) Impostos s/ Faturamento (est. 6,5%)" value={-impostosEstimados} valuePct={-pct(impostosEstimados, faturamentoBruto)} indent />
              <DreRow label="(-) Taxas de Cartão (est.)" value={-taxasCartao} valuePct={-pct(taxasCartao, faturamentoBruto)} indent />
              <DreRow label="(=) Receita Líquida" value={faturamentoBruto - impostosEstimados - taxasCartao} valuePct={pct(faturamentoBruto - impostosEstimados - taxasCartao, faturamentoBruto)} bold separator />
              <DreRow label={`(-) CMV (${params.cmvPct}% meta)`} value={-cmvReal} valuePct={-cmvRealPct} indent />
              <DreRow label="(=) Lucro Bruto" value={lucroBruto} valuePct={lucroBrutoPct} bold separator />
              <DreRow label={`(-) CMO — Mão de Obra (${params.cmoPct}% meta)`} value={-cmoReal} valuePct={-cmoRealPct} indent />
              <DreRow label="(-) Outras Despesas Operacionais" value={-Math.max(0, outrosDespesas)} valuePct={-pct(Math.max(0, outrosDespesas), faturamentoBruto)} indent />
              <DreRow label="(=) EBIT" value={ebit} valuePct={ebitPct} bold separator />
              <DreRow label="(+) Depreciação" value={params.depreciacao} valuePct={pct(params.depreciacao, faturamentoBruto)} indent />
              <DreRow label="(+) Amortização" value={params.amortizacao} valuePct={pct(params.amortizacao, faturamentoBruto)} indent />
              <DreRow label="(=) EBITDA" value={ebitda} valuePct={ebitdaPct} bold separator />
              <DreRow label="(-) Juros / Financiamentos" value={-params.juros} valuePct={-pct(params.juros, faturamentoBruto)} indent />
              <DreRow label="(-) IR / CSLL" value={-params.impostoRenda} valuePct={-pct(params.impostoRenda, faturamentoBruto)} indent />
              <DreRow label="(=) Lucro Líquido" value={lucroLiquido} valuePct={lucroLiquidoPct} bold separator />
            </tbody>
          </table>
        </div>
      </div>

      {/* Benchmarks do setor */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 space-y-3">
        <h3 className="text-sm font-extrabold text-[#0f172a] flex items-center gap-2">
          <Percent className="h-4 w-4 text-[#2563eb]" />
          Benchmarks do Setor (ABRASEL)
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "CMV", real: cmvRealPct, meta: benchmarks.cmv },
            { label: "CMO", real: cmoRealPct, meta: benchmarks.cmo },
            { label: "EBITDA", real: ebitdaPct, meta: benchmarks.ebitda },
            { label: "Margem Líquida", real: lucroLiquidoPct, meta: benchmarks.margemLiquida },
          ].map(({ label, real, meta }) => {
            const ok = label === "EBITDA" || label === "Margem Líquida" ? real >= meta : real <= meta;
            return (
              <div key={label} className={`rounded-xl border p-3 ${ok ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
                <p className="text-[9px] font-extrabold uppercase text-[#94a3b8] mb-1">{label}</p>
                <p className={`text-lg font-extrabold ${ok ? "text-emerald-700" : "text-red-600"}`}>{real.toFixed(1)}%</p>
                <p className="text-[9px] text-[#94a3b8]">Meta: {meta}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Extrato do mês */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-white overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-extrabold text-[#0f172a] hover:bg-[#f8fafc]"
          onClick={() => setShowExtrato(!showExtrato)}
        >
          <span className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-[#2563eb]" />
            Extrato do Mês ({entriesInMonth.length + billsInMonth.length} lançamentos)
          </span>
          {showExtrato ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showExtrato && (
          <div className="border-t border-[#f1f5f9] divide-y divide-[#f8fafc]">
            {entriesInMonth.length === 0 && billsInMonth.length === 0 ? (
              <p className="px-5 py-8 text-center text-xs text-[#94a3b8]">
                Nenhum lançamento no período selecionado.
              </p>
            ) : (
              [...entriesInMonth.map((e) => ({
                date: e.date,
                desc: e.desc,
                value: e.type === "entrada" ? e.value : -e.value,
                cat: e.catName,
                source: "manual" as const,
              })), ...billsInMonth.map((b) => ({
                date: b.vencimento,
                desc: b.desc,
                value: -b.value,
                cat: b.cat,
                source: "bill" as const,
              }))].sort((a, b) => a.date.localeCompare(b.date)).map((item, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-2.5">
                  <div>
                    <p className="text-xs font-semibold text-[#334155]">{item.desc}</p>
                    <p className="text-[10px] text-[#94a3b8]">{item.cat} • {item.date.substring(0, 10).split("-").reverse().join("/")}</p>
                  </div>
                  <span className={`text-xs font-bold font-mono ${item.value >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {item.value >= 0 ? "+" : ""}{formatBrl(item.value)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
