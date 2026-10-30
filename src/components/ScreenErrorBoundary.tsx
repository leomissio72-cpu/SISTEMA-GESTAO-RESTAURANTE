import React from "react";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

interface Props {
  /** Muda quando a pessoa troca de tela; limpa o erro anterior. */
  resetKey: string;
  onGoHome?: () => void;
  children: React.ReactNode;
}
interface State { error: Error | null }

/**
 * Se uma tela der erro, mostra um aviso no lugar dela em vez de deixar a página em branco.
 * O menu continua funcionando e a pessoa pode voltar ao início ou recarregar.
 */
export class ScreenErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Erro na tela:", error, info.componentStack);
  }

  componentDidUpdate(previous: Props) {
    if (previous.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-sm">
        <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
        <h2 className="mt-2 text-base font-extrabold text-[#152238]">Esta tela encontrou um problema</h2>
        <p className="mt-1 text-xs text-[#69778c]">Seus dados estão salvos. Volte ao início ou recarregue a página; se continuar, avise o suporte com o texto abaixo.</p>
        <pre className="mt-3 max-h-24 overflow-auto rounded-lg bg-[#f4f7fb] p-2 text-left text-[10px] text-[#526078] whitespace-pre-wrap">{this.state.error.message}</pre>
        <div className="mt-4 flex justify-center gap-2">
          {this.props.onGoHome && (
            <button type="button" onClick={() => { this.setState({ error: null }); this.props.onGoHome?.(); }} className="inline-flex items-center gap-1.5 rounded-xl border border-[#dce4f0] px-4 py-2 text-xs font-bold text-[#152238] hover:bg-[#f4f7fb]">
              <Home className="h-4 w-4" /> Voltar ao início
            </button>
          )}
          <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-1.5 rounded-xl bg-[#3c63da] px-4 py-2 text-xs font-bold text-white hover:bg-[#2f52c0]">
            <RotateCcw className="h-4 w-4" /> Recarregar
          </button>
        </div>
      </div>
    );
  }
}
