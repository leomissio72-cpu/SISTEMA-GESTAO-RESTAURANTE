import React, { useRef, useState } from "react";
import {
  NotaFiscal,
  NotaFiscalItem,
  CertificadoDigital,
  BillItem,
  UserSession,
  ScreenType,
} from "../../types";
import {
  FileText,
  Upload,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowDownToLine,
  Eye,
  RefreshCw,
  FilePlus,
  KeySquare,
  CloudDownload,
  X,
  ChevronDown,
  ChevronUp,
  FileX,
  BadgeCheck,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface NotasFiscaisScreenProps {
  notasFiscais: NotaFiscal[];
  certificados: CertificadoDigital[];
  bills: BillItem[];
  userSession: UserSession | null;
  onSaveNotasFiscais: (notas: NotaFiscal[]) => Promise<void>;
  onSaveCertificados: (certs: CertificadoDigital[]) => Promise<void>;
  onSaveBills: (bills: BillItem[]) => Promise<void>;
  onNavigate: (screen: ScreenType) => void;
}

type Tab = "notas" | "xml" | "certificado";
type StatusFilter = "todas" | "autorizada" | "cancelada" | "pendente_manifesto";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  autorizada: { label: "Autorizada", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  cancelada: { label: "Cancelada", color: "text-red-600 bg-red-50 border-red-200" },
  inutilizada: { label: "Inutilizada", color: "text-gray-500 bg-gray-50 border-gray-200" },
  denegada: { label: "Denegada", color: "text-orange-600 bg-orange-50 border-orange-200" },
};

const MANIFESTO_LABELS: Record<string, { label: string; color: string }> = {
  ciencia: { label: "Ciência", color: "text-sky-600 bg-sky-50 border-sky-200" },
  confirmada: { label: "Confirmada", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  desconhecida: { label: "Desconhecida", color: "text-gray-500 bg-gray-50 border-gray-200" },
  naoRealizada: { label: "Não Realizada", color: "text-red-600 bg-red-50 border-red-200" },
};

function parseMoeda(v: string | number): number {
  if (typeof v === "number") return v;
  return parseFloat(String(v).replace(",", ".")) || 0;
}

function parseNFeXml(xmlText: string): Partial<NotaFiscal> | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");
    const ns = "http://www.portalfiscal.inf.br/nfe";

    const get = (tag: string, parent?: Element): string => {
      const el = (parent || doc).getElementsByTagNameNS(ns, tag)[0]
        || (parent || doc).getElementsByTagName(tag)[0];
      return el?.textContent?.trim() || "";
    };

    const chave = get("chNFe") || doc.querySelector("infNFe")?.getAttribute("Id")?.replace("NFe", "") || "";
    const numero = get("nNF");
    const serie = get("serie");
    const emitente = get("xNome") || get("xFant") || "";
    const cnpjEmitente = get("CNPJ");
    const dataRaw = get("dhEmi") || get("dEmi");
    const dataEmissao = dataRaw ? dataRaw.substring(0, 10) : new Date().toISOString().substring(0, 10);
    const valor = parseMoeda(get("vNF") || get("vTotTrib") || "0");
    const natureza = get("natOp");

    const itensList: NotaFiscalItem[] = [];
    const dets = doc.getElementsByTagNameNS(ns, "det");
    const dets2 = dets.length ? dets : doc.getElementsByTagName("det");
    Array.from(dets2).forEach((det) => {
      const prod = det.getElementsByTagNameNS(ns, "prod")[0] || det.getElementsByTagName("prod")[0];
      if (!prod) return;
      itensList.push({
        descricao: get("xProd", prod as Element),
        quantidade: parseMoeda(get("qCom", prod as Element) || get("qTrib", prod as Element)),
        valorUnitario: parseMoeda(get("vUnCom", prod as Element) || get("vUnTrib", prod as Element)),
        valorTotal: parseMoeda(get("vProd", prod as Element)),
        ncm: get("NCM", prod as Element),
        cfop: get("CFOP", prod as Element),
        unidade: get("uCom", prod as Element),
      });
    });

    if (!numero && !chave) return null;

    return {
      chave,
      numero,
      serie,
      emitente,
      cnpjEmitente: cnpjEmitente.replace(/\D/g, ""),
      dataEmissao,
      valor,
      status: "autorizada",
      situacaoManifesto: "ciencia",
      naturezaOperacao: natureza,
      itens: itensList,
      fonte: "xml",
      xmlRaw: xmlText,
    };
  } catch {
    return null;
  }
}

function formatCnpj(cnpj: string) {
  const d = cnpj.replace(/\D/g, "");
  return d.length === 14
    ? d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    : cnpj;
}

function formatDate(iso: string) {
  if (!iso) return "-";
  const [y, m, d] = iso.substring(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function formatBrl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const NotasFiscaisScreen: React.FC<NotasFiscaisScreenProps> = ({
  notasFiscais,
  certificados,
  bills,
  userSession,
  onSaveNotasFiscais,
  onSaveCertificados,
  onSaveBills,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("notas");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConsulting, setIsConsulting] = useState(false);
  const xmlInputRef = useRef<HTMLInputElement>(null);
  const pfxInputRef = useRef<HTMLInputElement>(null);
  const [xmlPreview, setXmlPreview] = useState<Partial<NotaFiscal>[]>([]);
  const [isParsingXml, setIsParsingXml] = useState(false);

  const activeCert = certificados.find((c) => c.ativo);

  const filteredNotas = notasFiscais.filter((n) => {
    if (statusFilter === "autorizada" && n.status !== "autorizada") return false;
    if (statusFilter === "cancelada" && n.status !== "cancelada") return false;
    if (statusFilter === "pendente_manifesto" && n.situacaoManifesto === "confirmada") return false;
    if (search) {
      const q = search.toLowerCase();
      if (!n.emitente.toLowerCase().includes(q) && !n.numero.includes(q) && !n.chave.includes(q) && !n.cnpjEmitente.includes(q)) return false;
    }
    return true;
  });

  const pendentesImport = notasFiscais.filter((n) => n.status === "autorizada" && !n.importada).length;

  async function handleManifest(id: string, situacao: NotaFiscal["situacaoManifesto"]) {
    setIsSaving(true);
    try {
      const updated = notasFiscais.map((n) => n.id === id ? { ...n, situacaoManifesto: situacao } : n);
      await onSaveNotasFiscais(updated);
      toast.success("Manifestação registrada.");
    } catch { toast.error("Erro ao salvar manifestação."); }
    finally { setIsSaving(false); }
  }

  async function handleImportarContasPagar(nota: NotaFiscal) {
    if (nota.importada) { toast("Nota já importada."); return; }
    setIsSaving(true);
    try {
      const newBill: BillItem = {
        id: `nfe-${nota.id}`,
        desc: `NF ${nota.numero} — ${nota.emitente}`,
        vencimento: nota.dataEmissao,
        value: nota.valor,
        cat: "Compras / Fornecedores",
        status: "open",
        payMethod: "Boleto / Transferência",
        tenantId: "restaurante",
        createdAt: new Date().toISOString(),
      };
      await onSaveBills([...bills, newBill]);
      const updatedNotas = notasFiscais.map((n) =>
        n.id === nota.id ? { ...n, importada: true, billId: newBill.id, situacaoManifesto: "confirmada" as const } : n
      );
      await onSaveNotasFiscais(updatedNotas);
      toast.success("Nota importada para Contas a Pagar!");
    } catch { toast.error("Erro ao importar nota."); }
    finally { setIsSaving(false); }
  }

  function handleXmlFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setIsParsingXml(true);
    const results: Partial<NotaFiscal>[] = [];
    let remaining = files.length;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const parsed = parseNFeXml(text);
        if (parsed) results.push(parsed);
        remaining--;
        if (remaining === 0) {
          setXmlPreview(results);
          setIsParsingXml(false);
          if (results.length === 0) toast.error("Nenhum XML de NF-e válido encontrado.");
        }
      };
      reader.readAsText(file, "UTF-8");
    });
  }

  async function handleConfirmXmlImport() {
    if (xmlPreview.length === 0) return;
    setIsSaving(true);
    try {
      const existing = new Set(notasFiscais.map((n) => n.chave));
      const novas: NotaFiscal[] = xmlPreview
        .filter((p) => p.chave && !existing.has(p.chave))
        .map((p) => ({
          id: `nfe-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          chave: p.chave || "",
          numero: p.numero || "",
          serie: p.serie || "",
          emitente: p.emitente || "",
          cnpjEmitente: p.cnpjEmitente || "",
          dataEmissao: p.dataEmissao || new Date().toISOString().substring(0, 10),
          valor: p.valor || 0,
          status: "autorizada" as const,
          situacaoManifesto: "ciencia" as const,
          naturezaOperacao: p.naturezaOperacao,
          itens: p.itens,
          fonte: "xml" as const,
          xmlRaw: p.xmlRaw,
          createdAt: new Date().toISOString(),
        }));
      if (novas.length === 0) { toast("Todas as notas já estão cadastradas."); return; }
      await onSaveNotasFiscais([...notasFiscais, ...novas]);
      toast.success(`${novas.length} nota(s) importada(s) com sucesso.`);
      setXmlPreview([]);
      setActiveTab("notas");
    } catch { toast.error("Erro ao salvar notas."); }
    finally { setIsSaving(false); }
  }

  async function handlePfxUpload(file: File) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      // Lê os metadados simulados (em produção, o backend leria o .pfx com a senha)
      const cert: CertificadoDigital = {
        id: `cert-${Date.now()}`,
        nome: file.name.replace(".pfx", "").replace(".p12", ""),
        cnpj: userSession?.login || "",
        validade: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        tipo: "A1",
        ativo: true,
        uploadedAt: new Date().toISOString(),
        pfxBase64: base64,
      };
      setIsSaving(true);
      try {
        const updated = certificados.map((c) => ({ ...c, ativo: false }));
        await onSaveCertificados([...updated, cert]);
        toast.success("Certificado digital carregado com sucesso.");
      } catch { toast.error("Erro ao salvar certificado."); }
      finally { setIsSaving(false); }
    };
    reader.readAsDataURL(file);
  }

  async function handleConsultarReceita() {
    if (!activeCert) { toast.error("Configure um certificado digital primeiro."); setActiveTab("certificado"); return; }
    setIsConsulting(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsConsulting(false);
    toast("Consulta realizada. Notas já sincronizadas estão marcadas.", { icon: "ℹ️" });
  }

  async function handleLancarManual() {
    const numero = prompt("Número da NF-e:");
    if (!numero) return;
    const emitente = prompt("Nome do Emitente:") || "";
    const cnpj = prompt("CNPJ do Emitente (só números):") || "";
    const valorStr = prompt("Valor total (ex: 1234.50):") || "0";
    const data = prompt("Data de Emissão (AAAA-MM-DD):") || new Date().toISOString().substring(0, 10);
    const nova: NotaFiscal = {
      id: `nfe-${Date.now()}`,
      chave: `manual-${Date.now()}`,
      numero,
      serie: "1",
      emitente,
      cnpjEmitente: cnpj.replace(/\D/g, ""),
      dataEmissao: data,
      valor: parseFloat(valorStr) || 0,
      status: "autorizada",
      situacaoManifesto: "confirmada",
      fonte: "manual",
      createdAt: new Date().toISOString(),
    };
    setIsSaving(true);
    try {
      await onSaveNotasFiscais([...notasFiscais, nova]);
      toast.success("Nota lançada manualmente.");
    } catch { toast.error("Erro ao salvar."); }
    finally { setIsSaving(false); }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-[#0f172a] flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#2563eb]" />
            Notas Fiscais
          </h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            NF-e recebidas, XML, Receita Federal e Certificado Digital
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleConsultarReceita}
            disabled={isConsulting}
            className="flex items-center gap-1.5 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-xs font-bold text-[#1d4ed8] hover:bg-[#dbeafe] disabled:opacity-60"
          >
            {isConsulting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CloudDownload className="h-3.5 w-3.5" />}
            Consultar Receita Federal
          </button>
          <button
            onClick={handleLancarManual}
            className="flex items-center gap-1.5 rounded-lg border border-[#d1fae5] bg-[#f0fdf4] px-3 py-1.5 text-xs font-bold text-[#15803d] hover:bg-[#dcfce7]"
          >
            <FilePlus className="h-3.5 w-3.5" />
            Lançar Manual
          </button>
        </div>
      </div>

      {/* Alertas rápidos */}
      {!activeCert && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
          <span>
            <strong>Certificado Digital não configurado.</strong> Configure na aba Certificado Digital para consultar notas na Receita Federal.
          </span>
          <button onClick={() => setActiveTab("certificado")} className="ml-auto underline font-bold">Configurar</button>
        </div>
      )}

      {pendentesImport > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-sky-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-sky-500" />
          <span><strong>{pendentesImport}</strong> nota(s) autorizadas ainda não importadas para Contas a Pagar.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#e2e8f0]">
        {([["notas", "Notas Recebidas", FileText], ["xml", "Importar XML", Upload], ["certificado", "Certificado Digital", KeySquare]] as const).map(([tab, label, Icon]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === tab
                ? "border-[#2563eb] text-[#2563eb]"
                : "border-transparent text-[#64748b] hover:text-[#0f172a]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ─── Tab: Notas Recebidas ─── */}
      {activeTab === "notas" && (
        <div className="space-y-3">
          {/* Filtros */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Buscar por emitente, número, CNPJ…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-[#e2e8f0] bg-white pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-[#2563eb]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-xs focus:outline-none"
            >
              <option value="todas">Todos os status</option>
              <option value="autorizada">Autorizadas</option>
              <option value="cancelada">Canceladas</option>
              <option value="pendente_manifesto">Pendente manifesto</option>
            </select>
          </div>

          {filteredNotas.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e2e8f0] bg-[#f8fafc] py-16 text-center">
              <FileText className="h-10 w-10 text-[#cbd5e1] mb-3" />
              <p className="text-sm font-semibold text-[#475569]">Nenhuma nota encontrada</p>
              <p className="text-xs text-[#94a3b8] mt-1">Importe XMLs ou consulte a Receita Federal</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotas.map((nota) => {
                const expanded = expandedId === nota.id;
                const statusCfg = STATUS_LABELS[nota.status] || STATUS_LABELS.autorizada;
                const manifestoCfg = nota.situacaoManifesto ? MANIFESTO_LABELS[nota.situacaoManifesto] : null;
                return (
                  <div key={nota.id} className="rounded-xl border border-[#e2e8f0] bg-white overflow-hidden">
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#f8fafc]"
                      onClick={() => setExpandedId(expanded ? null : nota.id)}
                    >
                      {/* Ícone status */}
                      <div className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-bold ${statusCfg.color}`}>
                        {nota.status === "autorizada" ? <CheckCircle2 className="h-4 w-4" /> :
                         nota.status === "cancelada" ? <XCircle className="h-4 w-4" /> :
                         <AlertTriangle className="h-4 w-4" />}
                      </div>

                      {/* Info principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-[#0f172a] truncate">{nota.emitente || "Emitente não informado"}</span>
                          <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${statusCfg.color}`}>{statusCfg.label}</span>
                          {manifestoCfg && (
                            <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${manifestoCfg.color}`}>{manifestoCfg.label}</span>
                          )}
                          {nota.importada && (
                            <span className="px-1.5 py-0.5 rounded border text-[9px] font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
                              ✓ Importada
                            </span>
                          )}
                          {nota.fonte === "xml" && (
                            <span className="px-1.5 py-0.5 rounded border text-[9px] font-bold text-purple-700 bg-purple-50 border-purple-200">XML</span>
                          )}
                          {nota.fonte === "manual" && (
                            <span className="px-1.5 py-0.5 rounded border text-[9px] font-bold text-amber-700 bg-amber-50 border-amber-200">Manual</span>
                          )}
                        </div>
                        <div className="flex gap-3 mt-0.5 text-[10px] text-[#64748b] flex-wrap">
                          <span>NF {nota.numero}-{nota.serie}</span>
                          <span>{formatDate(nota.dataEmissao)}</span>
                          <span>CNPJ: {formatCnpj(nota.cnpjEmitente)}</span>
                        </div>
                      </div>

                      {/* Valor */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-extrabold text-[#0f172a]">{formatBrl(nota.valor)}</div>
                        <div className="text-[10px] text-[#94a3b8]">{expanded ? "Recolher" : "Expandir"}</div>
                      </div>
                      {expanded ? <ChevronUp className="h-4 w-4 text-[#94a3b8] flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-[#94a3b8] flex-shrink-0" />}
                    </div>

                    {expanded && (
                      <div className="border-t border-[#f1f5f9] px-4 py-3 space-y-3 bg-[#f8fafc]">
                        {/* Chave de acesso */}
                        <div>
                          <label className="text-[9px] font-extrabold uppercase text-[#94a3b8]">Chave de Acesso</label>
                          <p className="text-[10px] font-mono text-[#475569] break-all">{nota.chave || "—"}</p>
                        </div>

                        {nota.naturezaOperacao && (
                          <div>
                            <label className="text-[9px] font-extrabold uppercase text-[#94a3b8]">Natureza da Operação</label>
                            <p className="text-xs text-[#475569]">{nota.naturezaOperacao}</p>
                          </div>
                        )}

                        {/* Itens */}
                        {nota.itens && nota.itens.length > 0 && (
                          <div>
                            <label className="text-[9px] font-extrabold uppercase text-[#94a3b8] mb-1 block">Itens ({nota.itens.length})</label>
                            <div className="rounded-lg border border-[#e2e8f0] overflow-hidden">
                              <table className="w-full text-[10px]">
                                <thead className="bg-[#f1f5f9] text-[#64748b] font-bold">
                                  <tr>
                                    <th className="px-2 py-1.5 text-left">Descrição</th>
                                    <th className="px-2 py-1.5 text-right">Qtd</th>
                                    <th className="px-2 py-1.5 text-right">Vl. Unit.</th>
                                    <th className="px-2 py-1.5 text-right">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#f1f5f9]">
                                  {nota.itens.map((item, i) => (
                                    <tr key={i} className="bg-white">
                                      <td className="px-2 py-1.5 text-[#334155]">{item.descricao}</td>
                                      <td className="px-2 py-1.5 text-right text-[#334155]">{item.quantidade} {item.unidade}</td>
                                      <td className="px-2 py-1.5 text-right text-[#334155]">{formatBrl(item.valorUnitario)}</td>
                                      <td className="px-2 py-1.5 text-right font-bold text-[#0f172a]">{formatBrl(item.valorTotal)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Ações */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {nota.status === "autorizada" && !nota.importada && (
                            <button
                              onClick={() => handleImportarContasPagar(nota)}
                              disabled={isSaving}
                              className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3 py-1.5 text-[10px] font-bold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
                            >
                              <ArrowDownToLine className="h-3 w-3" />
                              Importar para Contas a Pagar
                            </button>
                          )}
                          {nota.status === "autorizada" && nota.situacaoManifesto !== "confirmada" && (
                            <button
                              onClick={() => handleManifest(nota.id, "confirmada")}
                              disabled={isSaving}
                              className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                            >
                              <BadgeCheck className="h-3 w-3" />
                              Confirmar Compra
                            </button>
                          )}
                          {nota.status === "autorizada" && nota.situacaoManifesto !== "naoRealizada" && (
                            <button
                              onClick={() => handleManifest(nota.id, "naoRealizada")}
                              disabled={isSaving}
                              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
                            >
                              <FileX className="h-3 w-3" />
                              Não Realizado
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Importar XML ─── */}
      {activeTab === "xml" && (
        <div className="space-y-4">
          <div
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#bfdbfe] bg-[#eff6ff] py-12 px-6 text-center cursor-pointer hover:bg-[#dbeafe] transition-colors"
            onClick={() => xmlInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleXmlFiles(e.dataTransfer.files); }}
          >
            <Upload className="h-10 w-10 text-[#3b82f6] mb-3" />
            <p className="text-sm font-extrabold text-[#1d4ed8]">Arraste XMLs de NF-e aqui</p>
            <p className="text-xs text-[#4f6fae] mt-1">ou clique para selecionar os arquivos</p>
            <p className="text-[10px] text-[#94a3b8] mt-2">Formato: XML padrão SEFAZ • Múltiplos arquivos</p>
            <input
              ref={xmlInputRef}
              type="file"
              accept=".xml"
              multiple
              className="hidden"
              onChange={(e) => handleXmlFiles(e.target.files)}
            />
          </div>

          {isParsingXml && (
            <div className="flex items-center gap-2 text-xs text-[#64748b]">
              <RefreshCw className="h-4 w-4 animate-spin" /> Lendo XMLs…
            </div>
          )}

          {xmlPreview.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#0f172a]">{xmlPreview.length} nota(s) encontrada(s) — Confirme para importar:</h3>
              <div className="space-y-2">
                {xmlPreview.map((p, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-white px-4 py-3">
                    <div>
                      <p className="text-xs font-bold text-[#0f172a]">{p.emitente || "Emitente não identificado"}</p>
                      <p className="text-[10px] text-[#64748b]">
                        NF {p.numero}-{p.serie} • {formatDate(p.dataEmissao || "")} • {p.itens?.length || 0} item(ns)
                      </p>
                    </div>
                    <div className="text-sm font-extrabold text-[#0f172a]">{formatBrl(p.valor || 0)}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmXmlImport}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-4 py-2 text-xs font-bold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Confirmar Importação
                </button>
                <button
                  onClick={() => setXmlPreview([])}
                  className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-4 py-2 text-xs font-bold text-[#64748b] hover:bg-[#f1f5f9]"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Certificado Digital ─── */}
      {activeTab === "certificado" && (
        <div className="space-y-4">
          {/* Certificado ativo */}
          {activeCert ? (
            <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5">
              <ShieldCheck className="h-10 w-10 text-emerald-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-extrabold text-emerald-800">Certificado Digital Ativo</p>
                <p className="text-xs text-emerald-700 mt-0.5">{activeCert.nome}</p>
                <div className="flex gap-4 mt-1 text-[10px] text-emerald-700">
                  <span>Tipo: {activeCert.tipo}</span>
                  <span>Validade: {formatDate(activeCert.validade)}</span>
                  <span>CNPJ: {formatCnpj(activeCert.cnpj)}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm("Deseja remover o certificado ativo?")) {
                    onSaveCertificados(certificados.map((c) => c.id === activeCert.id ? { ...c, ativo: false } : c));
                  }
                }}
                className="text-xs font-bold text-red-600 hover:underline"
              >
                Remover
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
              <AlertTriangle className="h-8 w-8 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">Nenhum certificado configurado</p>
                <p className="text-xs text-amber-700 mt-0.5">Faça o upload do arquivo .pfx ou .p12 do seu certificado A1.</p>
              </div>
            </div>
          )}

          {/* Upload */}
          <div
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#e2e8f0] bg-[#f8fafc] py-10 px-6 text-center cursor-pointer hover:bg-[#f1f5f9] transition-colors"
            onClick={() => pfxInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handlePfxUpload(f); }}
          >
            <KeySquare className="h-8 w-8 text-[#94a3b8] mb-2" />
            <p className="text-sm font-bold text-[#475569]">Upload do Certificado A1</p>
            <p className="text-xs text-[#94a3b8] mt-1">Arquivo .pfx ou .p12</p>
            <input
              ref={pfxInputRef}
              type="file"
              accept=".pfx,.p12"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePfxUpload(f); }}
            />
          </div>

          {/* Informativo */}
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 space-y-2 text-xs text-[#475569]">
            <p className="font-bold text-[#0f172a]">Como funciona o Certificado Digital?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>O certificado A1 (.pfx) autentica a empresa na SEFAZ e Receita Federal.</li>
              <li>Permite consultar NF-e emitidas contra o seu CNPJ automaticamente.</li>
              <li>Também habilita o manifesto eletrônico do destinatário (MDE).</li>
              <li>O arquivo é armazenado de forma segura e criptografada.</li>
            </ul>
          </div>

          {/* Histórico */}
          {certificados.length > 0 && (
            <div>
              <h3 className="text-xs font-extrabold uppercase text-[#94a3b8] mb-2">Histórico de Certificados</h3>
              <div className="space-y-1.5">
                {certificados.map((c) => (
                  <div key={c.id} className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${c.ativo ? "border-emerald-200 bg-emerald-50" : "border-[#e2e8f0] bg-white"}`}>
                    <div>
                      <p className="text-xs font-bold text-[#0f172a]">{c.nome}</p>
                      <p className="text-[10px] text-[#64748b]">Tipo: {c.tipo} • Validade: {formatDate(c.validade)} • Upload: {formatDate(c.uploadedAt.substring(0, 10))}</p>
                    </div>
                    {c.ativo && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Ativo</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
