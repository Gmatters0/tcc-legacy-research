"use client";

interface Props {
  preferencia: "A" | "B" | "";
  porque: string;
  feedback: string;
  onChangePreferencia: (valor: "A" | "B") => void;
  onChangePorque: (valor: string) => void;
  onChangeFeedback: (valor: string) => void;
  onEnviar: () => void;
  enviando: boolean;
  erro: string | null;
}

export function PassoComparacaoFinal({
  preferencia,
  porque,
  feedback,
  onChangePreferencia,
  onChangePorque,
  onChangeFeedback,
  onEnviar,
  enviando,
  erro,
}: Props) {
  return (
    <div className="w-full max-w-xl rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Comparação final</p>
      <h1 className="mt-1 text-xl font-semibold text-zinc-900">Cenário A vs. Cenário B</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Agora que você já concluiu a tarefa nos dois sistemas, compare a experiência.
      </p>

      <div className="mt-6 flex flex-col gap-5">
        <div>
          <p className="text-sm font-medium text-zinc-900">Qual interface você preferiu?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["A", "B"] as const).map((valor) => (
              <label
                key={valor}
                className={`cursor-pointer rounded-md border px-4 py-2.5 text-center text-sm ${
                  preferencia === valor
                    ? "border-zinc-900 bg-zinc-900 font-medium text-white"
                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                <input
                  type="radio"
                  name="preferencia"
                  value={valor}
                  checked={preferencia === valor}
                  onChange={() => onChangePreferencia(valor)}
                  className="sr-only"
                />
                Cenário {valor}
              </label>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Por quê?
          <textarea
            value={porque}
            onChange={(e) => onChangePorque(e.target.value)}
            placeholder="O que pesou na sua preferência?"
            className="min-h-[84px] rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Comentário adicional (opcional)
          <textarea
            value={feedback}
            onChange={(e) => onChangeFeedback(e.target.value)}
            placeholder="Algo mais que queira registrar sobre a experiência com os dois sistemas."
            className="min-h-[84px] rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
          />
        </label>
      </div>

      {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}

      <button
        type="button"
        onClick={onEnviar}
        disabled={enviando}
        className="mt-6 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
      >
        {enviando ? "Enviando…" : "Enviar e concluir participação"}
      </button>
    </div>
  );
}
