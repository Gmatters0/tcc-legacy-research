"use client";

import { useSessao } from "@/lib/instrumentation/SessaoProvider";
import { TipoEventoErro } from "@/lib/instrumentation/types";

const F_KEYS_DECORATIVAS = [
  { tecla: "[F3]", label: "Voltar", id: "F3-Voltar" },
  { tecla: "[F5]", label: "Pesquisar", id: "F5-Pesquisar" },
  { tecla: "[F7]", label: "Confirmar", id: "F7-Confirmar" },
];

export function FooterFKeys({ onSalvar }: { onSalvar: () => void }) {
  const { registrarErro } = useSessao();

  function handleElementoDecorativo(elemento: string) {
    registrarErro(TipoEventoErro.CLIQUE_FORA_FLUXO, `elemento: ${elemento}`);
  }

  return (
    <footer className="flex h-5 items-center justify-between border-t border-[#727780] bg-[#dbdad9] px-2 text-[10px] text-[#1b1c1c]">
      <div className="flex items-center gap-4">
        <button type="button" onClick={onSalvar} className="flex items-center gap-1 hover:bg-[#c2c7d0]">
          <span className="font-bold">[F2]</span>
          Salvar
        </button>
        {F_KEYS_DECORATIVAS.map(({ tecla, label, id }) => (
          <button
            key={tecla}
            type="button"
            onClick={() => handleElementoDecorativo(`footer.${id}`)}
            className="flex items-center gap-1 hover:bg-[#c2c7d0]"
          >
            <span className="font-bold">{tecla}</span>
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handleElementoDecorativo("footer.F12-Sair")}
          className="flex items-center gap-1 text-[#b91c1c] hover:bg-[#c2c7d0]"
        >
          <span className="font-bold">[F12]</span>
          Sair
        </button>
      </div>
      <div className="flex items-center gap-4">
        <span className="border border-[#727780] bg-[#d2d2d2] px-2 py-px">PRD-01</span>
        <span className="border border-[#727780] bg-[#d2d2d2] px-2 py-px">USER: ADMIN_LOG</span>
        <span className="border border-[#727780] bg-[#d2d2d2] px-2 py-px">CON: 800</span>
        <span className="border border-[#727780] bg-[#d2d2d2] px-2 py-px font-bold">OVR</span>
      </div>
    </footer>
  );
}
