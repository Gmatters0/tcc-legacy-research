"use client";

import { Search } from "lucide-react";

interface Props {
  armazem: string;
  lote: string;
  quantidade: number;
  status: "Pendente" | "Concluído";
  onChangeArmazem: (valor: string) => void;
  onChangeLote: (valor: string) => void;
  onAbrirModalDeposito: () => void;
}

export function FieldsetBaixa({
  armazem,
  lote,
  quantidade,
  status,
  onChangeArmazem,
  onChangeLote,
  onAbrirModalDeposito,
}: Props) {
  return (
    <fieldset className="border border-[#727780] p-2">
      <legend className="px-1 text-[11px] font-bold text-black">3. Baixa em Estoque</legend>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1 py-1">
        <label className="flex items-center gap-1 text-[11px] text-[#1b1c1c]">
          Dep. Destino:
          <input
            type="text"
            value={armazem}
            onChange={(e) => onChangeArmazem(e.target.value)}
            className="w-12 border border-[#6b7280] bg-white px-3 py-2 text-base text-[#1b1c1c] focus:outline-none"
          />
          <button
            type="button"
            onClick={onAbrirModalDeposito}
            title="Buscar depósito"
            className="flex h-5 items-center border border-white bg-[#d2d2d2] px-1 hover:bg-[#c2c7d0]"
          >
            <Search className="h-2.5 w-2.5 text-[#1b1c1c]" />
          </button>
        </label>
        <label className="flex items-center gap-2 text-[11px] text-[#1b1c1c]">
          Lote:
          <input
            type="text"
            value={lote}
            onChange={(e) => onChangeLote(e.target.value)}
            className="w-24 border border-[#6b7280] bg-white px-3 py-2 text-base text-[#1b1c1c] focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-[11px] text-[#1b1c1c]">
          Qtd. Lançar:
          <span className="w-20 border border-[#6b7280] bg-[#f3f4f6] px-3 py-2 text-right text-base text-[#1b1c1c]">
            {quantidade.toFixed(2)}
          </span>
        </label>
        <label className="flex items-center gap-2 text-[11px] text-[#1b1c1c]">
          Status:
          <span className="w-28 border border-[#727780] bg-white px-2 py-1 text-[11px] text-[#1b1c1c]">
            {status}
          </span>
        </label>
      </div>
    </fieldset>
  );
}
