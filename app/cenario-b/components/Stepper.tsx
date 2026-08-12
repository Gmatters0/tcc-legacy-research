"use client";

import { Check } from "lucide-react";

const STEPS = [
  { numero: 1, label: "Validação" },
  { numero: 2, label: "Conferência" },
  { numero: 3, label: "Baixa" },
];

interface Props {
  passoAtual: number;
  onNavegar: (passo: number) => void;
}

export function Stepper({ passoAtual, onNavegar }: Props) {
  return (
    <div className="relative flex w-full max-w-[768px] items-center justify-between">
      <div className="absolute left-0 right-0 top-4 h-0.5 -translate-y-1/2 bg-[#c3c6d7]" />
      <div
        className="absolute left-0 top-4 h-0.5 -translate-y-1/2 bg-[#004ac6] transition-all"
        style={{ width: `${((passoAtual - 1) / (STEPS.length - 1)) * 100}%` }}
      />
      {STEPS.map((step) => {
        const concluido = step.numero < passoAtual;
        const ativo = step.numero === passoAtual;
        return (
          <button
            key={step.numero}
            type="button"
            onClick={() => onNavegar(step.numero)}
            className="relative z-[1] flex flex-col items-center gap-2 bg-[#faf8ff] px-2"
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#faf8ff] text-sm font-medium ${
                concluido
                  ? "bg-[#16a34a] text-white"
                  : ativo
                    ? "bg-[#004ac6] text-white shadow-[0_0_0_4px_rgba(0,74,198,0.2)]"
                    : "bg-[#e1e2ed] text-[#434655]"
              }`}
            >
              {concluido ? <Check className="h-4 w-4" /> : step.numero}
            </div>
            <span className={`text-xs font-semibold ${ativo ? "text-[#004ac6]" : "text-[#434655]"}`}>
              {step.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
