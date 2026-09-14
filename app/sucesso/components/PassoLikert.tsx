"use client";

interface Props {
  passo: string;
  titulo: string;
  instrucao: string;
  itens: string[];
  respostas: (number | undefined)[];
  onChange: (indice: number, valor: number) => void;
  onAvancar: () => void;
  onVoltar?: () => void;
  textoAvancar?: string;
  erro: string | null;
  faltando: Set<number>;
}

export function PassoLikert({
  passo,
  titulo,
  instrucao,
  itens,
  respostas,
  onChange,
  onAvancar,
  onVoltar,
  textoAvancar,
  erro,
  faltando,
}: Props) {
  return (
    <div className="w-full max-w-xl rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{passo}</p>
      <h1 className="mt-1 text-xl font-semibold text-zinc-900">{titulo}</h1>
      <p className="mt-1 text-sm text-zinc-500">{instrucao}</p>

      <div className="mt-6 flex flex-col divide-y divide-zinc-100">
        {itens.map((texto, indice) => (
          <div key={indice} className="flex flex-col gap-2 py-4 first:pt-0">
            <p className={`text-sm ${faltando.has(indice) ? "text-red-600" : "text-zinc-900"}`}>
              <span className="mr-1.5 text-xs text-zinc-400">{String(indice + 1).padStart(2, "0")}</span>
              {texto}
            </p>
            <div
              className={`grid grid-cols-5 overflow-hidden rounded-md border ${
                faltando.has(indice) ? "border-red-400" : "border-zinc-200"
              }`}
            >
              {[1, 2, 3, 4, 5].map((valor) => {
                const marcado = respostas[indice] === valor;
                return (
                  <label
                    key={valor}
                    className={`flex cursor-pointer items-center justify-center border-r border-zinc-200 py-2.5 text-sm last:border-r-0 ${
                      marcado ? "bg-zinc-900 font-semibold text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${passo}-${indice}`}
                      value={valor}
                      checked={marcado}
                      onChange={() => onChange(indice, valor)}
                      className="sr-only"
                    />
                    {valor}
                  </label>
                );
              })}
            </div>
            <div className="flex justify-between text-[11px] text-zinc-400">
              <span>Discordo totalmente</span>
              <span>Concordo totalmente</span>
            </div>
          </div>
        ))}
      </div>

      {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}

      <div className="mt-6 flex gap-3">
        {onVoltar && (
          <button
            type="button"
            onClick={onVoltar}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            ← Anterior
          </button>
        )}
        <button
          type="button"
          onClick={onAvancar}
          className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
        >
          {textoAvancar ?? "Próximo →"}
        </button>
      </div>
    </div>
  );
}
