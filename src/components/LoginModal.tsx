import React, { useState } from "react";
import { UserSession } from "../types";
import { loginAPI, verifyMfaAPI } from "../api";
import { Copy, ShieldCheck } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div className="login-futuro pointer-events-none fixed inset-0" aria-hidden="true" />

      {/* Container transparente centralizado sobre o quadro bege da imagem de fundo */}
      <div className="relative my-auto box-border w-full max-w-sm px-6 py-6 sm:px-8">

        {errorMsg && <div className="mb-4 rounded-lg border border-[#fecaca] bg-[#fef2f2]/90 p-3 text-xs font-semibold text-[#991b1b]" role="alert">{errorMsg}</div>}
        {infoMsg && <div className="mb-4 rounded-lg border border-[#cfe0ff] bg-[#f1f6ff]/90 p-3 text-xs font-semibold text-[#315bc5]" role="status">{infoMsg}</div>}

        {!mfaState ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 id="login-title" className="mb-4 text-center text-2xl sm:mb-6 sm:text-3xl font-black text-[#3d1a00]" style={{ fontFamily: "'Georgia', serif" }}>
              Acessar Conta
            </h1>

            <div>
              <label htmlFor="input-login-username" className="mb-1.5 block text-sm font-medium text-[#3d1a00]">
                Nome de Usuário
              </label>
              <input
                id="input-login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-[#c9a27a]/60 bg-[#f5ede0]/70 px-3 py-2.5 text-sm text-[#3d1a00] outline-none transition focus:border-[#b84c1a] focus:bg-[#f5ede0]/90 focus:ring-2 focus:ring-[#b84c1a]/20"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="input-login-password" className="mb-1.5 block text-sm font-medium text-[#3d1a00]">
                Senha
              </label>
              <input
                id="input-login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#c9a27a]/60 bg-[#f5ede0]/70 px-3 py-2.5 text-sm text-[#3d1a00] outline-none transition focus:border-[#b84c1a] focus:bg-[#f5ede0]/90 focus:ring-2 focus:ring-[#b84c1a]/20"
                autoComplete="current-password"
              />
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-[#b84c1a] py-3.5 text-base font-bold text-white shadow-md transition hover:bg-[#973d13] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>

            <div className="text-center">
              <button type="button" className="text-sm text-[#3d1a00] underline underline-offset-2 hover:text-[#b84c1a]">
                Esqueceu a senha?
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <h1 className="mb-6 text-center text-2xl font-black text-[#3d1a00]" style={{ fontFamily: "'Georgia', serif" }}>
              Verificação em Duas Etapas
            </h1>

            {mfaState.mode === "setup" && (
              <div className="rounded-lg border border-[#c9a27a]/40 bg-[#f5ede0]/80 p-4 text-xs text-[#5c3a1e]">
                <div className="flex items-center gap-2 font-bold text-[#3d1a00]">
                  <ShieldCheck className="h-4 w-4" />Ativação obrigatória do MFA
                </div>
                <p className="mt-2 leading-5">Adicione esta chave ao Google Authenticator:</p>
                <code className="mt-2 block break-all rounded bg-white/60 p-2 text-[10px] text-[#3d1a00]">{mfaState.secret}</code>
                <button type="button" onClick={() => void navigator.clipboard?.writeText(mfaState.otpauth || mfaState.secret || "")} className="mt-2 inline-flex items-center gap-1 font-bold text-[#b84c1a]">
                  <Copy className="h-3 w-3" />Copiar chave
                </button>
              </div>
            )}

            <div>
              <label htmlFor="input-mfa-code" className="mb-1.5 block text-sm font-medium text-[#3d1a00]">
                Código do autenticador
              </label>
              <input
                id="input-mfa-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full rounded-lg border border-[#c9a27a]/60 bg-[#f5ede0]/70 px-3 py-3 text-center text-xl font-extrabold tracking-[0.4em] text-[#3d1a00] outline-none focus:border-[#b84c1a]"
                autoFocus
              />
            </div>

            <button type="submit" disabled={isLoading || mfaCode.length !== 6} className="w-full rounded-xl bg-[#b84c1a] py-3.5 text-base font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60">
              {isLoading ? "Validando..." : "Confirmar acesso"}
            </button>

            <div className="text-center">
              <button type="button" onClick={() => { setMfaState(null); setMfaCode(""); setErrorMsg(""); setInfoMsg(""); }} className="text-sm text-[#3d1a00] underline underline-offset-2">
                Voltar ao login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
