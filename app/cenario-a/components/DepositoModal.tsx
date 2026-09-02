"use client";

import { X } from "lucide-react";
import { ARMAZENS_DISPONIVEIS } from "@/lib/task-config";

interface Props {
  onSelecionar: (codigo: string) => void;
  onFechar: () => void;
}

export function DepositoModal({ onSelecionar, onFechar }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm border border-[#727780] bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-[#c2c7d0] bg-[#efeded] px-4 py-2">
          <span className="text-sm font-bold text-[#1b1c1c]">Selecionar Depósito</span>
          <button type="button" onClick={onFechar} aria-label="Fechar">
            <X className="h-4 w-4 text-[#42474f]" />
          </button>
        </div>
        <ul className="flex flex-col">
          {ARMAZENS_DISPONIVEIS.map((armazem) => (
            <li key={armazem.codigo} className="border-b border-[#c2c7d0] last:border-b-0">
              <button
                type="button"
                onClick={() => onSelecionar(armazem.codigo)}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-xs text-[#1b1c1c] hover:bg-[#f3f4f6]"
              >
                <span className="font-bold">{armazem.codigo}</span>
                <span className="text-[#42474f]">{armazem.nome}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
