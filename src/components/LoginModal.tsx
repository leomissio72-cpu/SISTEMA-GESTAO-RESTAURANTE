import React, { useState } from "react";
import { UserSession } from "../types";
import { loginAPI, verifyMfaAPI } from "../api";
import { ArrowRight, BadgeCheck, Copy, ShieldCheck, User, X } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onSuccess: (session: UserSession) => void;
  onClose?: () => void;
}

type MfaState = { mode: "setup" | "login"; token: string; secret?: string; otpauth?: string; user: any } | null;

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onSuccess, onClose }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaState, setMfaState] = useState<MfaState>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  if (!isOpen) return null;

  const finishLogin = (data: any) => {
    const user = data.user;
    onSuccess({
      login: user.login,
      name: user.nome,
      tenant: user.unidade,
      profile: user.perfil,
      expiresAt: data.expiresAt,
      token: data.token,
    });
    onClose?.();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const login = username.trim();
    if (!login || !password) { setErrorMsg("Por favor, preencha o login e a senha."); return; }
    setIsLoading(true); setErrorMsg(""); setInfoMsg("");
    try {
      const data = await loginAPI(login, password);
      setPassword("");
      if (data.mfaSetupRequired) {
        setMfaState({ mode: "setup", token: data.setupToken, secret: data.secret, otpauth: data.otpauth, user: data.user });
        setInfoMsg("Ative o segundo fator no aplicativo autenticador e informe o código de 6 dígitos.");
      } else if (data.mfaRequired) {
        setMfaState({ mode: "login", token: data.challengeToken, user: data.user });
        setInfoMsg("Informe o código de 6 dígitos do seu aplicativo autenticador.");
      } else {
        finishLogin(data);
      }
    } catch (error: any) {
      setErrorMsg(error?.message || "Erro de autenticação. Verifique seu login e senha.");
    } finally { setIsLoading(false); }
  };

  const handleMfaSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!mfaState || !/^\d{6}$/.test(mfaCode)) { setErrorMsg("Informe um código MFA de 6 dígitos."); return; }
    setIsLoading(true); setErrorMsg("");
    try {
      const data = await verifyMfaAPI(mfaState.mode === "setup"
        ? { setupToken: mfaState.token, secret: mfaState.secret, code: mfaCode }
        : { challengeToken: mfaState.token, code: mfaCode });
      setMfaState(null); setMfaCode(""); setInfoMsg(""); finishLogin(data);
    } catch (error: any) { setErrorMsg(error?.message || "Código MFA inválido."); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 pb-10 pt-[6vh] sm:p-6" role="dialog" aria-modal="true" aria-labelledby="login-title">
      {/* Imagem de fundo Mexicaníssimo */}
      <div className="login-futuro pointer-events-none fixed inset-0" aria-hidden="true" />
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/30 sm:my-auto bg-white/95 shadow-[0_32px_80px_rgba(80,20,0,0.45)] backdrop-blur">
        <div className="relative p-6 sm:p-8">
          {onClose && <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1.5 text-[#69778c] transition hover:bg-[#f4f7fb] hover:text-[#152238]" aria-label="Fechar login"><X className="h-5 w-5" /></button>}
          <div className="mb-6 flex flex-col items-center">
            <img src="/logo-mexicanissimo.png" alt="Mexicaníssimo" className="h-16 w-auto object-contain" />
          </div>

          {errorMsg && <div className="mb-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3 text-xs font-semibold text-[#991b1b]" role="alert">{errorMsg}</div>}
          {infoMsg && <div className="mb-4 rounded-xl border border-[#cfe0ff] bg-[#f1f6ff] p-3 text-xs font-semibold text-[#315bc5]" role="status">{infoMsg}</div>}

          {!mfaState ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label htmlFor="input-login-username" className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-[#69778c]">Login ou e-mail</label><div className="relative"><User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69778c]" /><input id="input-login-username" type="text" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="login ou e-mail" className="w-full rounded-xl border border-[#e5eaf1] bg-[#fbfcff] py-2.5 pl-9 pr-3 text-sm font-medium text-[#152238] outline-none transition focus:border-[#3c63da] focus:bg-white focus:ring-4 focus:ring-[#3c63da]/15" autoComplete="username" autoFocus /></div></div>
              <div><label htmlFor="input-login-password" className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-[#69778c]">Senha de acesso</label><div className="relative"><BadgeCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69778c]" /><input id="input-login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-[#e5eaf1] bg-[#fbfcff] py-2.5 pl-9 pr-3 text-sm font-medium text-[#152238] outline-none transition focus:border-[#3c63da] focus:bg-white focus:ring-4 focus:ring-[#3c63da]/15" autoComplete="current-password" /></div></div>
              <button id="btn-submit-login" type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#b84c1a] py-3 text-sm font-bold text-white shadow-md shadow-[#b84c1a]/30 transition hover:bg-[#973d13] focus:outline-none focus:ring-4 focus:ring-[#b84c1a]/30 disabled:cursor-not-allowed disabled:opacity-60">{isLoading ? <span>Entrando...</span> : <><span>Entrar</span><ArrowRight className="h-4 w-4" /></>}</button>
            </form>
          ) : (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              {mfaState.mode === "setup" && <div className="rounded-xl border border-[#dbe5f6] bg-[#f8faff] p-4 text-xs text-[#526078]"><div className="flex items-center gap-2 font-extrabold text-[#152238]"><ShieldCheck className="h-4 w-4 text-[#3c63da]" />Ativação obrigatória do MFA</div><p className="mt-2 leading-5">Adicione esta chave ao Google Authenticator, Microsoft Authenticator ou 1Password:</p><code className="mt-2 block break-all rounded-lg bg-white p-2 text-[10px] text-[#315bc5]">{mfaState.secret}</code><button type="button" onClick={() => void navigator.clipboard?.writeText(mfaState.otpauth || mfaState.secret || "")} className="mt-2 inline-flex items-center gap-1 font-bold text-[#315bc5]"><Copy className="h-3 w-3" />Copiar chave</button></div>}
              <div><label htmlFor="input-mfa-code" className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-[#69778c]">Código do autenticador</label><input id="input-mfa-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="w-full rounded-xl border border-[#e5eaf1] bg-[#fbfcff] px-3 py-3 text-center text-xl font-extrabold tracking-[0.4em] text-[#152238] outline-none focus:border-[#3c63da]" autoFocus /></div>
              <button type="submit" disabled={isLoading || mfaCode.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3c63da] py-3 text-sm font-bold text-white shadow-md shadow-[#3c63da]/20 disabled:cursor-not-allowed disabled:opacity-60">{isLoading ? "Validando..." : "Confirmar acesso seguro"}<ShieldCheck className="h-4 w-4" /></button>
              <button type="button" onClick={() => { setMfaState(null); setMfaCode(""); setErrorMsg(""); setInfoMsg(""); }} className="w-full text-xs font-bold text-[#69778c] hover:text-[#152238]">Voltar ao login</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
