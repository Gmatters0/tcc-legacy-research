"use client";

import { TLX_ITENS, TlxChave } from "@/lib/avaliacao-config";

interface Props {
  valores: Record<TlxChave, number>;
  tocado: Record<TlxChave, boolean>;
  onChange: (chave: TlxChave, valor: number) => void;
  onAvancar: () => void;
  erro: string | null;
}

export function PassoTlx({ valores, tocado, onChange, onAvancar, erro }: Props) {
  return (
    <div className="w-full max-w-xl rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Passo 1 de 3</p>
      <h1 className="mt-1 text-xl font-semibold text-zinc-900">Carga de Trabalho — NASA-TLX</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Para cada dimensão, arraste o controle até o ponto que melhor descreve como você se sentiu durante a tarefa
        que acabou de realizar.
      </p>

      <div className="mt-6 flex flex-col divide-y divide-zinc-100">
        {TLX_ITENS.map((item) => (
          <div key={item.chave} className="flex flex-col gap-2 py-5 first:pt-0">
            <div>
              <p className="text-sm font-medium text-zinc-900">{item.titulo}</p>
              <p className="text-xs text-zinc-500">{item.descricao}</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={valores[item.chave]}
                onChange={(e) => onChange(item.chave, Number(e.target.value))}
                className="h-1.5 flex-1 accent-zinc-900"
              />
              <span className="min-w-[2.5rem] rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-center text-xs text-zinc-700">
                {tocado[item.chave] ? valores[item.chave] : "—"}
              </span>
            </div>
            <div className="flex justify-between text-xs text-zinc-400">
              <span>{item.rotuloEsquerda}</span>
              <span>{item.rotuloDireita}</span>
            </div>
          </div>
        ))}
      </div>

      {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}

      <button
        type="button"
        onClick={onAvancar}
        className="mt-6 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
      >
        Próximo →
      </button>
    </div>
  );
}
