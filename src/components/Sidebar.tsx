import React from "react";
import {
  ScreenType,
  UserSession
} from "../types";
import {
  Home,
  TrendingUp,
  Percent,
  Users,
  KeyRound,
  Settings,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Store,
  CreditCard,
  UploadCloud,
  PackageCheck,
  BookOpen,
  FileText,
  BarChart3,
} from "lucide-react";

interface SidebarProps {
  currentScreen: ScreenType;
  onSelectScreen: (screen: ScreenType) => void;
  userSession: UserSession | null;
  permissions: Record<string, Record<string, boolean>>;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: ScreenType;
  label: string;
  icon: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onSelectScreen,
  userSession,
  permissions,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const userProfile = userSession?.profile || "operador";
  const userPerms = permissions[userProfile] || {};

  const canAccessScreen = (screen: ScreenType): boolean => {
    if (screen === "home" || screen === "instrucoes") return true;
    if (userProfile === "dono" || userProfile === "equipe") return true;
    if (screen === "configuracao") return userProfile === "admin";
    if (screen === "pagamentos_despesas") {
      return (
        userPerms.pagamentos_despesas !== false &&
        (userPerms.lancamentos !== false ||
          userPerms.rp !== false ||
          userPerms.vt !== false ||
          userPerms.conciliation !== false)
      );
    }
    return userPerms[screen] !== false;
  };

  // 1. Principal
  const principalNav: NavItem[] = [
    { id: "home", label: "Início", icon: <Home className="h-4 w-4" /> },
    { id: "dashboard", label: "Analítico", icon: <TrendingUp className="h-4 w-4 text-sky-400" /> },
    { id: "instrucoes", label: "Manual de uso", icon: <BookOpen className="h-4 w-4" /> },
  ];

  // 2. Financeiro
  const financialNav: NavItem[] = [
    { id: "pagamentos_despesas", label: "Pagamentos e Despesas", icon: <CreditCard className="h-4 w-4 text-emerald-400" /> },
    { id: "notas_fiscais", label: "Notas Fiscais", icon: <FileText className="h-4 w-4 text-blue-400" /> },
    { id: "dre_restaurante", label: "DRE Restaurante", icon: <BarChart3 className="h-4 w-4 text-purple-400" /> },
    { id: "fees", label: "Taxas e Recebimentos", icon: <Percent className="h-4 w-4 text-sky-400" /> },
    { id: "produtos", label: "Fornecedores e Produtos", icon: <PackageCheck className="h-4 w-4" /> },
  ];

  // 3. Configurações & Gestão
  const managementNav: NavItem[] = [
    { id: "configuracao", label: "Configurações", icon: <Settings className="h-4 w-4" /> },
    { id: "employees", label: "Funcionários", icon: <Users className="h-4 w-4" /> },
    { id: "users", label: "Acessos e Logins", icon: <KeyRound className="h-4 w-4" /> },
  ];

  const handleNavClick = (screen: ScreenType) => {
    onSelectScreen(screen);
    if (isOpenMobile) {
      onCloseMobile();
    }
  };

  const renderNavGroup = (title: string, items: NavItem[]) => {
    const visibleItems = items
      .filter((item) => canAccessScreen(item.id))
      // Quando a sidebar está minimizada, não mostramos o item "Início" (home)
      .filter((item) => !(isCollapsed && item.id === "home"));
    if (visibleItems.length === 0) return null;

    return (
      <div className="mb-3">
        {!isCollapsed && (
          <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#7185a5] mb-1.5 truncate">
            {title}
          </div>
        )}
        <nav className="flex flex-col gap-0.5">
          {visibleItems.map((item) => {
            const isActive =
              currentScreen === item.id ||
              (item.id === "pagamentos_despesas" &&
                ["pagamentos_despesas", "lancamentos", "conciliation", "vt", "rp", "dre"].includes(currentScreen));
            const isSpecialConfig = item.id === "configuracao";
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`flex w-full items-center rounded-lg transition-all text-left group ${
                  isCollapsed
                    ? "justify-center p-2.5"
                    : "gap-2.5 px-3 py-2 text-xs font-semibold"
                } ${
                  isActive
                    ? "bg-[#2563eb] text-white shadow-sm font-bold"
                    : isSpecialConfig
                    ? "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                    : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                }`}
              >
                <span
                  className={`flex-shrink-0 ${
                    isActive
                      ? "text-white"
                      : isSpecialConfig
                      ? "text-[#64748b] group-hover:text-[#2563eb]"
                      : "text-[#64748b] group-hover:text-[#2563eb]"
                  }`}
                >
                  {item.icon}
                </span>
                {!isCollapsed && <span className="truncate flex-1">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#f8fafc] text-[#334155] p-4 overflow-y-auto overflow-x-hidden border-r border-[#e2e8f0]">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
        {!isCollapsed && (
          <div className="flex flex-col gap-0.5">
            <img src="/logo-mexicanissimo.png" alt="Mexicaníssimo" className="h-9 w-auto object-contain object-left" />
            <p className="text-[10px] text-[#64748b] truncate">
              Operação do restaurante
            </p>
          </div>
        )}

        {/* Toggle Collapse Button Desktop */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#eff6ff] hover:text-[#2563eb] transition-colors cursor-pointer"
          title={isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>

        {isOpenMobile && (
          <button
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#eff6ff] lg:hidden cursor-pointer"
            aria-label="Fechar Menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Ícone do restaurante quando minimizado */}
      {isCollapsed && (
        <div className="my-2 flex flex-col items-center gap-1.5 py-2 border-b border-[#e2e8f0]">
          <button
            onClick={() => onSelectScreen("home")}
            title="Gestão de Restaurantes"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1b2d4b] text-[#3c63da] border border-[#3c63da]/30 hover:bg-[#273b60]"
          >
            <Store className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Acesso principal de importação: fica separado dos demais itens para não desaparecer no menu */}
      {canAccessScreen("import_base") && (
        <button
          id="sidebar-upload-base"
          onClick={() => handleNavClick("import_base")}
          title={isCollapsed ? "Importar base" : undefined}
          className={`mb-4 flex w-full items-center rounded-xl border border-[#bfdbfe] bg-[#eff6ff] text-left text-[#1d4ed8] transition-colors hover:bg-[#dbeafe] ${isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-3"}`}
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#2563eb] text-white shadow-sm">
            <UploadCloud className="h-4 w-4" />
          </span>
          {!isCollapsed && (
            <span className="min-w-0">
              <span className="block text-xs font-extrabold">Importar base</span>
              <span className="mt-0.5 block truncate text-[10px] font-medium text-[#4f6fae]">Excel, PDF, CSV ou OFX</span>
            </span>
          )}
        </button>
      )}

      {/* Nav Groups */}
      <div className="flex-1 space-y-1 mt-1">
        {renderNavGroup("Principal", principalNav)}
        {renderNavGroup("Financeiro", financialNav)}
        {renderNavGroup("Configurações & Gestão", managementNav)}
      </div>

      <div className="mt-auto" aria-hidden="true" />
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Collapsible Fixed) */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 z-40 transition-all duration-300 ease-in-out ${
          isCollapsed ? "lg:w-20" : "lg:w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-[#f8fafc]">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
