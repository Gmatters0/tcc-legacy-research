"use client";

import { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import type { ErroApi } from "../types";

interface Props {
  erros: ErroApi[];
  onFechar: () => void;
}

export function ErrorReviewModal({ erros, onFechar }: Props) {
  const [etapa, setEtapa] = useState<"confirmar" | "detalhe">("confirmar");
  // Vários itens vazios geram a mesma mensagem repetida (uma por item) — a
  // instrumentação já registrou cada ocorrência real, aqui só evita mostrar a
  // mesma frase várias vezes na lista.
  const errosUnicos = Array.from(new Map(erros.map((erro) => [erro.mensagem, erro])).values());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md border border-[#727780] bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-[#c2c7d0] bg-[#efeded] px-4 py-2">
          <span className="text-sm font-bold text-[#1b1c1c]">
            {etapa === "confirmar" ? "Erros ao salvar" : "Log de erros"}
          </span>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="rounded p-0.5 hover:bg-[#d2d2d2]">
            <X className="h-4 w-4 text-[#42474f]" />
          </button>
        </div>

        {etapa === "confirmar" ? (
          <div className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 shrink-0 text-[#b91c1c]" />
              <p className="text-sm text-[#1b1c1c]">
                Foram identificados erros ao tentar salvar, gostaria de verificar?
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onFechar}
                className="border border-[#727780] bg-[#d2d2d2] px-4 py-1.5 text-xs text-[#1b1c1c] hover:bg-[#c2c7d0]"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => setEtapa("detalhe")}
                className="border border-[#727780] bg-[#004ac6] px-4 py-1.5 text-xs text-white hover:bg-[#003a9b]"
              >
                Sim, verificar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-6">
            <ul className="flex flex-col gap-2 text-xs text-[#1b1c1c]">
              {errosUnicos.map((erro, index) => (
                <li key={index} className="border border-[#c2c7d0] bg-[#f9f9f9] p-2">
                  <span className="font-bold">{erro.campo}:</span> {erro.mensagem}
                </li>
              ))}
            </ul>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onFechar}
                className="border border-[#727780] bg-[#d2d2d2] px-4 py-1.5 text-xs text-[#1b1c1c] hover:bg-[#c2c7d0]"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
