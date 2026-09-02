"use client";

import { Bell, Grid3x3, Search, Settings } from "lucide-react";
import { useSessao } from "@/lib/instrumentation/SessaoProvider";
import { TipoEventoErro } from "@/lib/instrumentation/types";

export function TopAppBar() {
  const { registrarErro } = useSessao();

  function handleElementoDecorativo(elemento: string) {
    registrarErro(TipoEventoErro.CLIQUE_FORA_FLUXO, `elemento: ${elemento}`);
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-[#c3c6d7] bg-[#faf8ff]/80 px-8 backdrop-blur-md">
      <div className="flex items-center gap-6">
        <span className="text-base font-semibold text-[#191b23]">Fiscal Management</span>
        <nav className="flex items-center gap-6 text-sm">
          <button
            type="button"
            onClick={() => handleElementoDecorativo("topbar.nav-Home")}
            className="text-[#434655]"
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => handleElementoDecorativo("topbar.nav-Analytics")}
            className="text-[#434655]"
          >
            Analytics
          </button>
          <button
            type="button"
            onClick={() => handleElementoDecorativo("topbar.nav-Audit")}
            className="border-b-2 border-[#004ac6] pb-1 font-bold text-[#004ac6]"
          >
            Audit
          </button>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#434655]" />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 rounded-full border border-[#c3c6d7] bg-[#f3f3fe] py-2 pl-9 pr-4 text-sm text-[#434655] placeholder:text-[#434655] focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => handleElementoDecorativo("topbar.icone-notificacoes")}
          className="rounded-full p-2 text-[#434655] hover:bg-[#f3f3fe]"
        >
          <Bell className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleElementoDecorativo("topbar.icone-configuracoes")}
          className="rounded-full p-2 text-[#434655] hover:bg-[#f3f3fe]"
        >
          <Settings className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleElementoDecorativo("topbar.icone-apps")}
          className="rounded-full p-2 text-[#434655] hover:bg-[#f3f3fe]"
        >
          <Grid3x3 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleElementoDecorativo("topbar.avatar")}
          className="h-8 w-8 rounded-full border border-[#c3c6d7] bg-[#d0e1fb] text-center text-sm font-bold leading-8 text-[#54647a]"
        >
          JD
        </button>
      </div>
    </header>
  );
}
