"use client";

import { BarChart3, Boxes, HelpCircle, LayoutDashboard, LogOut, Plus, Receipt, Settings } from "lucide-react";
import { useSessao } from "@/lib/instrumentation/SessaoProvider";
import { TipoEventoErro } from "@/lib/instrumentation/types";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, active: false },
  { label: "Fiscal", icon: Receipt, active: true },
  { label: "Inventory", icon: Boxes, active: false },
  { label: "Reports", icon: BarChart3, active: false },
  { label: "Settings", icon: Settings, active: false },
];

export function SideNavBar() {
  const { registrarErro } = useSessao();

  function handleElementoDecorativo(elemento: string) {
    registrarErro(TipoEventoErro.CLIQUE_FORA_FLUXO, `elemento: ${elemento}`);
  }

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-[260px] flex-col justify-between border-r border-[#c3c6d7] bg-white py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#004ac6] text-sm font-bold text-white">
            F
          </div>
          <div>
            <p className="text-xl font-bold leading-tight text-[#004ac6]">FiscalCorp</p>
            <p className="text-xs text-[#434655]">ERP v2.4</p>
          </div>
        </div>
        <div className="px-4">
          <button
            type="button"
            onClick={() => handleElementoDecorativo("sidenav.QuickAction")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#004ac6] px-4 py-2 text-sm font-medium text-white shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Quick Action
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
            <button
              key={label}
              type="button"
              onClick={() => handleElementoDecorativo(`sidenav.${label}`)}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium ${
                active ? "bg-[#2563eb] text-[#eeefff]" : "text-[#434655]"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex flex-col gap-1 border-t border-[#c3c6d7] px-2 pt-4">
        <button
          type="button"
          onClick={() => handleElementoDecorativo("sidenav.Support")}
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-[#434655]"
        >
          <HelpCircle className="h-[18px] w-[18px]" />
          Support
        </button>
        <button
          type="button"
          onClick={() => handleElementoDecorativo("sidenav.Logout")}
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-[#434655]"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </button>
      </div>
    </aside>
  );
}
