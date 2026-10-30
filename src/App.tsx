import React, { useEffect, useState, useCallback } from "react";
import {
  ScreenType,
  UserSession,
  DreParams,
  DreRestauranteParams,
  NotaFiscal,
  CertificadoDigital,
  PaymentMethod,
  BusinessRule,
  VTConfig,
  ManualEntry,
  SystemSettings,
  AuditLog,
  CloudState,
  UserAccount,
  Employee,
  BillItem,
  RegisteredSupplier,
  HomologatedProduct,
  IntercompanyRule,
} from "./types";
import {
  fetchHealth,
  fetchServerState,
  subscribeToEvents,
  updateSingleConfig,
  updateBulkConfig,
  fetchAuditLogs,
  saveDreParams,
  savePaymentRules,
  saveVtConfig,
  saveSuppliers,
  saveProducts,
  createManualEntry,
  createManualEntriesBulk,
  deleteManualEntry,
  saveSystemSettings,
  saveIntercompanyRules,
  resetDatabase,
  clearOperationalData,
  syncStateSection,
  logoutAPI,
  setAuthToken,
} from "./api";
import { isFirebaseMirrorAvailable } from "./firebaseState";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { LoginModal } from "./components/LoginModal";
import { HomeScreen } from "./components/screens/HomeScreen";
import { ConfiguracaoScreen } from "./components/screens/ConfiguracaoScreen";
import { DashboardScreen } from "./components/screens/DashboardScreen";
import { DreScreen } from "./components/screens/DreScreen";
import { DreParamsScreen } from "./components/screens/DreParamsScreen";
import { FeesScreen } from "./components/screens/FeesScreen";
import { LancamentosScreen } from "./components/screens/LancamentosScreen";
import { ConciliationScreen } from "./components/screens/ConciliationScreen";
import { VtScreen } from "./components/screens/VtScreen";
import { ScreenErrorBoundary } from "./components/ScreenErrorBoundary";
import { EmployeesScreen } from "./components/screens/EmployeesScreen";
import { UsersScreen } from "./components/screens/UsersScreen";
import { SettingsScreen } from "./components/screens/SettingsScreen";
import { ProdutosHomologadosScreen } from "./components/screens/ProdutosHomologadosScreen";
import { PagamentosDespesasScreen, PagamentoSubTab } from "./components/screens/PagamentosDespesasScreen";
import { InstrucoesScreen } from "./components/screens/InstrucoesScreen";
import { NotasFiscaisScreen } from "./components/screens/NotasFiscaisScreen";
import { DreRestauranteScreen } from "./components/screens/DreRestauranteScreen";
import { Cloud, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export const App: React.FC = () => {
  // Navigation & Routing
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash.replace("#", "");
    if (path === "/configuracao" || hash === "configuracao") return "configuracao";
    if (path === "/instrucoes" || hash === "instrucoes") return "instrucoes";
    if (
      hash &&
      [
        "home",
        "configuracao",
        "dashboard",
        "dre",
        "dreparams",
        "fees",
        "pagamentos_despesas",
        "lancamentos",
        "conciliation",
        "vt",
        "rp",
        "employees",
        "users",
        "settings",
        "produtos",
        "instrucoes",
      ].includes(hash)
    ) {
      return hash as ScreenType;
    }
    return "home";
  });

  const currentTenantId = "restaurante";
  const currentBusinessId = "restaurante";

  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const stored = sessionStorage.getItem("gestao_user_session") || localStorage.getItem("gestao_user_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (!parsed.expiresAt || parsed.expiresAt > Date.now())) {
          return parsed;
        }
      }
    } catch {}
    return null;
  });
  const [isLoginOpen, setIsLoginOpen] = useState(() => {
    try {
      const stored = sessionStorage.getItem("gestao_user_session") || localStorage.getItem("gestao_user_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (!parsed.expiresAt || parsed.expiresAt > Date.now())) {
          return false;
        }
      }
    } catch {}
    return true;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("restaurantes-theme") === "dark");
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>("");

  // Server State & Audit Logs
  const [serverState, setServerState] = useState<CloudState | null>(() => {
    try {
      const cached = localStorage.getItem("gestaorestaurantes_cloud_state");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed) return parsed;
      }
    } catch {}
    return null;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // O endereço fica sempre limpo: a tela aberta não aparece na barra do navegador.
  useEffect(() => {
    if (window.location.pathname !== "/" || window.location.hash || window.location.search) {
      window.history.replaceState(null, "", "/");
    }
  }, [currentScreen]);

  // Saída automática após 30 minutos sem uso; é preciso entrar de novo.
  useEffect(() => {
    if (!userSession) return;
    const IDLE_LIMIT_MS = 30 * 60 * 1000;
    let lastActivity = Date.now();
    const markActivity = () => { lastActivity = Date.now(); };
    const events = ["mousedown", "keydown", "touchstart", "scroll", "mousemove"] as const;
    events.forEach((name) => window.addEventListener(name, markActivity, { passive: true, capture: true }));
    const check = window.setInterval(() => {
      if (Date.now() - lastActivity >= IDLE_LIMIT_MS) {
        void logoutAPI().catch(() => undefined);
        setUserSession(null);
        setIsLoginOpen(true);
        toast("Sessão encerrada por inatividade. Entre novamente.");
      }
    }, 15000);
    return () => {
      window.clearInterval(check);
      events.forEach((name) => window.removeEventListener(name, markActivity, { capture: true } as EventListenerOptions));
    };
  }, [userSession]);

  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", isDarkMode);
    localStorage.setItem("restaurantes-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    if (!userSession) return;
    const expiresAt = userSession.expiresAt || Date.now() + 8 * 60 * 60 * 1000;
    const timer = window.setTimeout(() => { void logoutAPI().catch(() => undefined); setUserSession(null); setIsLoginOpen(true); }, Math.max(0, expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [userSession]);

  // Load state and audit logs from cloud backend
  const loadState = useCallback(async () => {
    try {
      const [state, health] = await Promise.all([fetchServerState(), fetchHealth()]);
      // Uma leitura mais antiga do que a tela já mostra (ex.: outra instância do servidor) não pode
      // fazer dados recém-salvos sumirem e voltarem.
      setServerState((prev) => {
        const prevTs = prev?.lastUpdated ? Date.parse(prev.lastUpdated) || 0 : 0;
        const nextTs = state?.lastUpdated ? Date.parse(state.lastUpdated) || 0 : 0;
        const newClear = Boolean(state.operationalClearedAt && state.operationalClearedAt !== prev?.operationalClearedAt);
        return prev && prevTs > nextTs && !newClear ? prev : state;
      });
      setLoadError("");
      setLastSyncTime(new Date(state.lastUpdated || Date.now()).toLocaleTimeString("pt-BR"));
      setIsCloudConnected(health?.storage === "durable" || isFirebaseMirrorAvailable());

      const logsRes = await fetchAuditLogs();
      if (logsRes.auditLogs) {
        setAuditLogs(logsRes.auditLogs);
      }
    } catch (err: any) {
      console.error("Failed to load initial server state:", err);
      setIsCloudConnected(false);
      const isAuthError = err?.message?.includes("Sessão expirada") || err?.message?.includes("401");
      if (isAuthError) {
        setUserSession(null);
        setIsLoginOpen(true);
      } else {
        setLoadError("Não foi possível carregar os dados desta conta. Verifique a conexão.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userSession) {
      setServerState(null);
      setLoadError("");
      setIsLoading(false);
      setAuditLogs([]);
      return;
    }

    setLoadError("");
    setAuditLogs([]);
    setIsLoading(!serverState);
    void loadState();

    // Subscribe only while the current authenticated account is active.
    const unsubscribe = subscribeToEvents((newState: CloudState) => {
      setServerState((prevState) => {
        if (!prevState) return newState;
        const previousUpdatedAt = new Date(prevState.lastUpdated || 0).getTime();
        const incomingUpdatedAt = new Date(newState.lastUpdated || 0).getTime();
        if (Number.isFinite(previousUpdatedAt) && Number.isFinite(incomingUpdatedAt) && incomingUpdatedAt < previousUpdatedAt) {
          return prevState;
        }
        // Mesmo timestamp = evento de keepalive do servidor; não re-renderizar
        // (impede o Analítico de recriar gráficos a cada segundo)
        if (previousUpdatedAt === incomingUpdatedAt && previousUpdatedAt > 0) {
          return prevState;
        }
        return { ...newState };
      });
      setLastSyncTime(new Date(newState.lastUpdated || Date.now()).toLocaleTimeString("pt-BR"));
      setIsCloudConnected(isFirebaseMirrorAvailable());

      // refresh logs on state update
      fetchAuditLogs().then((res) => {
        if (res.auditLogs) setAuditLogs(res.auditLogs);
      }).catch(console.error);
    }, (durable) => setIsCloudConnected(durable || isFirebaseMirrorAvailable()));

    return () => {
      unsubscribe();
    };
  }, [loadState, userSession]);

  // Action Handlers
  const handleUpdateConfig = async (key: string, value: any) => {
    setIsSavingConfig(true);
    try {
      const res = await updateSingleConfig(key, value, userSession?.name || "Administrador");
      if (res.state) setServerState(res.state);
      // O histórico de auditoria atualiza em segundo plano; a janela não precisa esperar por ele.
      void fetchAuditLogs().then((logsRes) => { if (logsRes.auditLogs) setAuditLogs(logsRes.auditLogs); });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleBulkUpdateConfig = async (updates: Array<{ key: string; value: any }>) => {
    setIsSavingConfig(true);
    try {
      const res = await updateBulkConfig(updates, userSession?.name || "Administrador");
      if (res.state) setServerState(res.state);
      // O histórico de auditoria atualiza em segundo plano; a janela não precisa esperar por ele.
      void fetchAuditLogs().then((logsRes) => { if (logsRes.auditLogs) setAuditLogs(logsRes.auditLogs); });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSaveDreParams = async (tenantId: string, params: DreParams) => {
    const currentDreParams = serverState?.dreParams || {};
    const updatedState = await saveDreParams(
      tenantId,
      params,
      userSession?.name || "Admin",
      userSession?.login,
      currentDreParams,
      userSession ? { profile: userSession.profile, tenant: userSession.tenant, login: userSession.login } : undefined,
    );
    setServerState(updatedState);
  };

  const handleSavePaymentRules = async (methods: PaymentMethod[], rules: BusinessRule) => {
    const updatedState = await savePaymentRules(methods, rules, userSession?.name || "Admin");
    setServerState(updatedState);
  };

  const handleSaveVtConfig = async (tenantId: string, config: VTConfig) => {
    const updatedState = await saveVtConfig(tenantId, config, userSession?.name || "Admin");
    setServerState(updatedState);
  };

  const handleSaveSuppliers = async (newSuppliers: RegisteredSupplier[]) => {
    setIsSavingConfig(true);
    try {
      const actor = { profile: userSession?.profile || "dono", tenant: userSession?.tenant || "dono", login: userSession?.login || "admin" };
      const updatedState = await saveSuppliers(newSuppliers, userSession?.name || "Admin", actor);
      setServerState((prev) => ({
        ...updatedState,
        suppliers: updatedState.suppliers || newSuppliers,
      }));
      void fetchAuditLogs().then((logsRes) => { if (logsRes.auditLogs) setAuditLogs(logsRes.auditLogs); });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSaveProducts = async (newProducts: HomologatedProduct[]) => {
    setIsSavingConfig(true);
    setServerState((prev) => (prev ? { ...prev, products: newProducts } : prev));
    try {
      const actor = { profile: userSession?.profile || "dono", tenant: userSession?.tenant || "dono", login: userSession?.login || "admin" };
      const updatedState = await saveProducts(newProducts, userSession?.name || "Admin", actor);
      setServerState((prev) => ({
        ...updatedState,
        products: newProducts,
      }));
      // O histórico de auditoria atualiza em segundo plano; a janela não precisa esperar por ele.
      void fetchAuditLogs().then((logsRes) => { if (logsRes.auditLogs) setAuditLogs(logsRes.auditLogs); });
    } catch (e) {
      console.error("Erro ao salvar produtos homologados:", e);
      throw e;
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleCreateManualEntry = async (entry: Partial<ManualEntry>) => {
    const updatedState = await createManualEntry(entry, userSession?.name || "Admin");
    setServerState(updatedState);
  };

  const handleDeleteManualEntry = async (id: string) => {
    setServerState((prev) => (prev ? { ...prev, manualEntries: (prev.manualEntries || []).filter((e) => e.id !== id) } : prev));
    const updatedState = await deleteManualEntry(id, userSession?.name || "Admin");
    setServerState(updatedState);
  };

  const handleUpdateManualEntry = async (id: string, patch: Partial<ManualEntry>) => {
    setServerState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        manualEntries: (prev.manualEntries || []).map((entry) => entry.id === id ? { ...entry, ...patch } : entry),
      };
    });
    const currentEntries = serverState?.manualEntries || [];
    const updatedEntries = currentEntries.map((entry) => entry.id === id ? { ...entry, ...patch } : entry);
    const updatedState = await syncStateSection("manualEntries", updatedEntries, userSession?.name || "Admin", userSession || undefined);
    setServerState(updatedState);
  };

  const handleSaveNotasFiscais = async (notas: NotaFiscal[]) => {
    const actor = { profile: userSession?.profile || "dono", tenant: userSession?.tenant || "dono", login: userSession?.login || "admin" };
    const updatedState = await syncStateSection("notasFiscais", notas, userSession?.name || "Admin", actor);
    setServerState(updatedState);
  };

  const handleSaveCertificados = async (certs: CertificadoDigital[]) => {
    const actor = { profile: userSession?.profile || "dono", tenant: userSession?.tenant || "dono", login: userSession?.login || "admin" };
    const updatedState = await syncStateSection("certificados", certs, userSession?.name || "Admin", actor);
    setServerState(updatedState);
  };

  const handleSaveDreRestauranteParams = async (p: DreRestauranteParams) => {
    const actor = { profile: userSession?.profile || "dono", tenant: userSession?.tenant || "dono", login: userSession?.login || "admin" };
    const updatedState = await syncStateSection("dreRestauranteParams", p, userSession?.name || "Admin", actor);
    setServerState(updatedState);
  };

  const handleSaveBills = async (newBills: BillItem[]) => {
    const actor = { profile: userSession?.profile || "dono", tenant: userSession?.tenant || "dono", login: userSession?.login || "admin" };
    const updatedState = await syncStateSection("bills", newBills, userSession?.name || "Admin", actor);
    setServerState(updatedState);
  };

  const handleSaveSettings = async (settings: SystemSettings) => {
    const updatedState = await saveSystemSettings({ ...settings, autoSync: true, syncInterval: settings.syncInterval || 30 }, userSession?.name || "Admin");
    setServerState(updatedState);
  };

  const handleSaveIntercompanyRules = async (rules: IntercompanyRule[]) => {
    const updatedState = await saveIntercompanyRules(rules, userSession?.name || "Admin");
    setServerState(updatedState);
  };

  const handleSaveUsers = async (users: UserAccount[], credential?: { userId: string; password: string }) => {
    const updatedState = await syncStateSection("users", users, userSession?.name || "Administrador", userSession || undefined, credential);
    setServerState(updatedState);
  };

  const handleSaveEmployees = async (employees: Employee[], credential?: { userId: string; password: string }) => {
    const currentUsers = serverState?.users || [];
    const generatedUsers = employees
      .filter((employee) => employee.login?.trim())
      .map((employee) => {
        const existing = currentUsers.find((user) => user.employeeId === employee.id || user.login.toLowerCase() === employee.login!.trim().toLowerCase());
        return {
          id: existing?.id || `user-${employee.id}`,
          nome: employee.nome,
          email: employee.email,
          login: employee.login!.trim(),
          perfil: employee.accessProfile || existing?.perfil || "operador",
          unidade: employee.unidade,
          status: employee.active === false ? "inativo" : "ativo",
          employeeId: employee.id,
        } as UserAccount;
      });
    const generatedIds = new Set(generatedUsers.map((user) => user.id));
    const preservedUsers = currentUsers.filter((user) => !user.employeeId || !employees.some((employee) => employee.id === user.employeeId));
    const updatedState = await syncStateSection("employees", employees, userSession?.name || "Administrador", userSession || undefined);
    const nextUsers = [...preservedUsers.filter((user) => !generatedIds.has(user.id)), ...generatedUsers];
    // Só grava os acessos quando algo mudou neles (evita uma segunda espera a cada cadastro).
    const usersChanged = Boolean(credential) || JSON.stringify(nextUsers) !== JSON.stringify(currentUsers);
    if (!usersChanged) { setServerState(updatedState); return; }
    const stateWithUsers = await syncStateSection("users", nextUsers, userSession?.name || "Administrador", userSession || undefined, credential);
    setServerState({ ...updatedState, ...stateWithUsers });
  };

  const handleResetDatabase = async () => {
    const updatedState = await resetDatabase();
    setServerState(updatedState);
    // O histórico de auditoria atualiza em segundo plano; a janela não precisa esperar por ele.
    void fetchAuditLogs().then((logsRes) => { if (logsRes.auditLogs) setAuditLogs(logsRes.auditLogs); });
  };

  const handleClearOperationalData = async () => {
    const updatedState = await clearOperationalData();
    setServerState(updatedState);
    // O histórico de auditoria atualiza em segundo plano; a janela não precisa esperar por ele.
    void fetchAuditLogs().then((logsRes) => { if (logsRes.auditLogs) setAuditLogs(logsRes.auditLogs); });
  };


  const handleLoginSuccess = (session: UserSession) => {
    const fullSession = { ...session, expiresAt: session.expiresAt || Date.now() + 8 * 60 * 60 * 1000 };
    setUserSession(fullSession);
    if ((session as any).token) {
      setAuthToken((session as any).token);
    }
    try {
      sessionStorage.setItem("gestao_user_session", JSON.stringify(fullSession));
      localStorage.setItem("gestao_user_session", JSON.stringify(fullSession));
      if ((session as any).token) {
        sessionStorage.setItem("gestao_auth_token", (session as any).token);
        localStorage.setItem("gestao_auth_token", (session as any).token);
      }
    } catch {}
    setIsLoginOpen(false);
    setCurrentScreen("home");
  };

  const handleLogout = () => {
    void logoutAPI().catch(() => undefined);
    try {
      sessionStorage.removeItem("gestao_user_session");
      localStorage.removeItem("gestao_user_session");
      sessionStorage.removeItem("gestao_auth_token");
      localStorage.removeItem("gestao_auth_token");
      localStorage.removeItem("sofiacfo_user_session");
    } catch (e) {}
    setUserSession(null);
    setServerState(null);
    setLastSyncTime("");
    setAuditLogs([]);
    setIsLoginOpen(true);
  };

  // Se não estiver logado, exibe apenas a tela de Login segura.
  if (!userSession) {
    return (
      <LoginModal
        isOpen={true}
        onSuccess={handleLoginSuccess}
      />
    );
  }

  if (isLoading || !serverState) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#b84c1a]">
        <div className="flex flex-col items-center gap-6">
          <img
            src="/logo-m.png"
            alt="Mexicaníssimo"
            className="h-28 w-28 object-contain drop-shadow-2xl"
            style={{ animation: "pulse 1.6s ease-in-out infinite" }}
          />
          <p className="text-sm font-semibold tracking-widest text-white/80 uppercase">
            {loadError || "Carregando..."}
          </p>
          {loadError && (
            <button type="button" onClick={() => void loadState()} className="rounded-xl bg-white/20 px-5 py-2 text-sm font-bold text-white hover:bg-white/30">
              Tentar novamente
            </button>
          )}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(.93)} }`}</style>
      </div>
    );
  }

  const {
    dreParams,
    paymentMethods,
    businessRules,
    vtConfigs,
    manualEntries,
    bills = [],
    systemSettings,
    configs,
    permissions,
    products = [],
    suppliers = [],
    intercompanyRules = [],
  } = serverState;

  const franchises = serverState.franchises || [];
  const businesses = serverState.businesses || [];
  const royalties = serverState.royalties || {};

  return (
    <div className={`app-shell flex min-h-screen bg-[#f4f7fb] text-[#152238] font-sans antialiased selection:bg-[#3c63da] selection:text-white ${isDarkMode ? "theme-dark" : ""}`}>
      {/* Sidebar Desktop & Mobile Drawer */}
      <Sidebar
        currentScreen={currentScreen}
        onSelectScreen={(screen) => {
          setCurrentScreen(screen);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        userSession={userSession}
        permissions={permissions || {}}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Container with responsive padding for collapsed sidebar */}
      <div
        className={`flex flex-1 flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        {/* Top Header */}
        <Header
          userSession={userSession}
          currentScreen={currentScreen}
          tenantName="Restaurante"
          isCloudConnected={isCloudConnected}
          lastSyncTime={lastSyncTime}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onLogout={handleLogout}
          onForceSync={loadState}
          onOpenImport={() => setCurrentScreen("import_base")}
          onNavigate={(screen) => setCurrentScreen(screen)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode((current) => !current)}
        />

        {/* Dynamic Screen View */}
        <main className="flex-1 p-2.5 sm:p-4 lg:p-5 max-w-7xl w-full mx-auto pb-16 md:pb-6">
          <ScreenErrorBoundary resetKey={currentScreen} onGoHome={() => setCurrentScreen("home")}>
          {currentScreen === "home" && (
            <HomeScreen
              currentTenantId={currentTenantId}
              franchises={franchises}
              businesses={businesses}
              currentBusinessId={currentBusinessId}
              onSelectTenant={() => {}}
              onSelectBusiness={() => {}}
              userSession={userSession}
              onNavigate={setCurrentScreen}
              dreParams={dreParams}
              royalties={royalties}
              manualEntries={manualEntries}
            />
          )}

          {currentScreen === "instrucoes" && (
            <InstrucoesScreen
              userSession={userSession}
              onNavigate={setCurrentScreen}
            />
          )}

          {currentScreen === "configuracao" && (
            <ConfiguracaoScreen
              configs={configs}
              auditLogs={auditLogs}
              userSession={userSession}
              currentTenantId={currentTenantId}
              businesses={businesses}
              franchises={franchises}
              royalties={royalties}
              matrizFunds={serverState.matrizFunds || {}}
              permissions={permissions}
              settings={systemSettings}
              users={serverState.users}
              suppliers={suppliers}
              intercompanyRules={intercompanyRules}
              products={products}
              dreParams={dreParams}
              initialTab="configs"
              onClearOperationalData={handleClearOperationalData}
              onUpdateConfig={handleUpdateConfig}
              onBulkUpdate={handleBulkUpdateConfig}
              onSaveSettings={handleSaveSettings}
              onSaveUsers={handleSaveUsers}
              onSaveSuppliers={handleSaveSuppliers}
              onSaveProducts={handleSaveProducts}
              onSaveIntercompanyRules={handleSaveIntercompanyRules}
              onSaveDreParams={handleSaveDreParams}
              onResetDatabase={handleResetDatabase}
              onRefresh={loadState}
              isSaving={isSavingConfig}
            />
          )}

          {currentScreen === "settings" && (
            <SettingsScreen
              settings={systemSettings}
              onSaveSettings={handleSaveSettings}
              onResetDatabase={handleResetDatabase}
              onNavigate={setCurrentScreen}
            />
          )}

          {currentScreen === "dashboard" && (
            <DashboardScreen
              franchises={franchises}
              businesses={businesses}
              currentBusinessId={currentBusinessId}
              currentTenantId={currentTenantId}
              onSelectTenant={() => {}}
              onNavigate={setCurrentScreen}
              dreParams={dreParams}
              royalties={royalties}
              matrizFunds={serverState.matrizFunds || {}}
              bills={bills}
              userSession={userSession}
              manualEntries={manualEntries}
            />
          )}

          {currentScreen === "dreparams" && (
            <DreParamsScreen
              currentTenantId={currentTenantId}
              franchises={franchises}
              dreParams={dreParams}
              onSaveParams={handleSaveDreParams}
              onNavigate={setCurrentScreen}
            />
          )}

          {currentScreen === "fees" && (
            <FeesScreen
              currentTenantId={currentTenantId}
              paymentMethods={paymentMethods as PaymentMethod[]}
              businessRules={businessRules as BusinessRule}
              onSavePaymentRules={handleSavePaymentRules}
              onNavigate={setCurrentScreen}
              userSession={userSession}
            />
          )}

          {currentScreen === "produtos" && (
            <ProdutosHomologadosScreen
              products={products}
              suppliers={suppliers}
              userSession={userSession}
              businesses={businesses}
              franchises={franchises}
              currentBusinessId={currentBusinessId}
              currentTenantId={currentTenantId}
              onSaveSuppliers={handleSaveSuppliers}
            />
          )}

          {["pagamentos_despesas", "lancamentos", "conciliation", "import_base", "vt", "rp", "dre"].includes(currentScreen) && (
            <PagamentosDespesasScreen
              currentTenantId={currentTenantId}
              currentBusinessId={currentBusinessId}
              userSession={userSession}
              franchises={franchises}
              businesses={serverState?.businesses || []}
              manualEntries={manualEntries}
              intercompanyRules={intercompanyRules}
              bills={bills}
              dreParams={dreParams}
              royalties={royalties}
              onSaveDreParams={handleSaveDreParams}
              onSelectTenant={() => {}}
              onSelectBusiness={() => {}}
              onCreateEntry={handleCreateManualEntry}
              onCreateEntriesBulk={async (entries) => {
                const updatedState = await createManualEntriesBulk(entries);
                setServerState(updatedState);
              }}
              onDeleteEntry={handleDeleteManualEntry}
              onUpdateEntry={handleUpdateManualEntry}
              onSaveBills={handleSaveBills}
              vtConfigs={vtConfigs}
              employees={serverState?.employees || []}
              onSaveVtConfig={handleSaveVtConfig}
              onNavigate={setCurrentScreen}
              initialTab={
                currentScreen === "lancamentos"
                  ? "lancamentos"
                  : currentScreen === "conciliation" || currentScreen === "import_base"
                  ? "conciliation"
                  : currentScreen === "vt"
                  ? "vt"
                  : currentScreen === "rp"
                  ? "rp"
                  : currentScreen === "dre"
                  ? "dre"
                  : "rp"
              }
            />
          )}

          {currentScreen === "employees" && (
            <EmployeesScreen
              currentTenantId={currentTenantId}
              franchises={franchises}
              employees={serverState.employees || []}
              onSaveEmployees={handleSaveEmployees}
              onNavigate={setCurrentScreen}
            />
          )}

          {currentScreen === "users" && (
            <UsersScreen
              users={serverState.users || []}
              employees={serverState.employees || []}
              franchises={franchises}
              userSession={userSession}
              onSaveUsers={(users, credential) => handleSaveUsers(users, credential)}
              onNavigate={setCurrentScreen}
            />
          )}

          {currentScreen === "notas_fiscais" && (
            <NotasFiscaisScreen
              notasFiscais={serverState.notasFiscais || []}
              certificados={serverState.certificados || []}
              bills={bills}
              userSession={userSession}
              onSaveNotasFiscais={handleSaveNotasFiscais}
              onSaveCertificados={handleSaveCertificados}
              onSaveBills={handleSaveBills}
              onNavigate={setCurrentScreen}
            />
          )}

          {currentScreen === "dre_restaurante" && (
            <DreRestauranteScreen
              dreParams={serverState.dreRestauranteParams || { cmvPct: 32, cmoPct: 28, depreciacao: 0, amortizacao: 0, juros: 0, impostoRenda: 0 }}
              manualEntries={manualEntries}
              bills={bills}
              paymentMethods={paymentMethods as PaymentMethod[]}
              onSaveDreParams={handleSaveDreRestauranteParams}
            />
          )}

          </ScreenErrorBoundary>
        </main>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />
      <Toaster position="top-right" />
    </div>
  );
};

export default App;
