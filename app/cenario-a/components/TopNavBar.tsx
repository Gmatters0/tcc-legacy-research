"use client";

import { ArrowLeft, ArrowUp, HelpCircle, Printer, Save, Search } from "lucide-react";
import { useSessao } from "@/lib/instrumentation/SessaoProvider";
import { TipoEventoErro } from "@/lib/instrumentation/types";

const MENU_ITEMS = ["Menu", "Edit", "Favorites", "Extras", "System", "Help"];

export function TopNavBar({ onSalvar }: { onSalvar: () => void }) {
  const { registrarErro } = useSessao();

  function handleElementoDecorativo(elemento: string) {
    registrarErro(TipoEventoErro.CLIQUE_FORA_FLUXO, `elemento: ${elemento}`);
  }

  return (
    <header className="flex flex-col gap-0.5 border-b border-[#c2c7d0] bg-[#efeded] px-1 pb-1 pt-1">
      <nav className="flex items-center gap-2 px-1">
        <span className="pr-4 text-sm font-bold text-[#1b1c1c]">LOGISTICS-ERP v4.2</span>
        {MENU_ITEMS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => handleElementoDecorativo(`menu.${item}`)}
            className="px-2 py-0.5 text-xs text-[#42474f]"
          >
            {item}
          </button>
        ))}
      </nav>
      <div className="flex items-center justify-between border border-white bg-[#d2d2d2] p-1">
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 border border-[#727780] bg-white p-0.5">
            <button
              type="button"
              onClick={() => handleElementoDecorativo("toolbar.ENT_NF-busca")}
              className="ml-1 flex items-center"
            >
              <Search className="h-3.5 w-4 text-[#42474f]" />
            </button>
            <input
              type="text"
              defaultValue="ENT_NF"
              readOnly
              className="h-5 w-32 px-3 py-1 text-[11px] text-[#1b1c1c] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleElementoDecorativo("toolbar.ENT_NF-seta")}
              className="px-1 text-[10px] text-[#42474f]"
            >
              ▾
            </button>
          </div>
          <div className="mx-1 h-5 w-px bg-[#727780]" />
          <button
            type="button"
            onClick={onSalvar}
            title="Salvar"
            className="flex h-6 w-6 items-center justify-center border border-white bg-[#d2d2d2]"
          >
            <Save className="h-3 w-3 text-[#1b1c1c]" />
          </button>
          <button
            type="button"
            title="Imprimir"
            onClick={() => handleElementoDecorativo("toolbar.Imprimir")}
            className="flex h-6 w-6 items-center justify-center border border-white bg-[#d2d2d2]"
          >
            <Printer className="h-3 w-3 text-[#1b1c1c]" />
          </button>
          <button
            type="button"
            title="Voltar"
            onClick={() => handleElementoDecorativo("toolbar.Voltar")}
            className="flex h-6 w-6 items-center justify-center border border-white bg-[#d2d2d2]"
          >
            <ArrowLeft className="h-3 w-3 text-[#1b1c1c]" />
          </button>
          <button
            type="button"
            title="Topo"
            onClick={() => handleElementoDecorativo("toolbar.Topo")}
            className="flex h-6 w-6 items-center justify-center border border-white bg-[#d2d2d2]"
          >
            <ArrowUp className="h-3 w-3 text-[#1b1c1c]" />
          </button>
          <button
            type="button"
            title="Ajuda"
            onClick={() => handleElementoDecorativo("toolbar.Ajuda")}
            className="flex h-6 w-6 items-center justify-center border border-white bg-[#d2d2d2]"
          >
            <HelpCircle className="h-3 w-3 text-[#1b1c1c]" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => handleElementoDecorativo("toolbar.Execute")}
          className="border border-white bg-[#d2d2d2] px-3 py-1 text-[11px] text-[#1b1c1c]"
        >
          Execute
        </button>
      </div>
    </header>
  );
}
