"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export default function SucessoPage() {
  const router = useRouter();
  const [finalizando, setFinalizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleFinalizarParticipacao() {
    setFinalizando(true);
    setErro(null);
    try {
      const response = await fetch("/api/auth/finalizar-participacao", { method: "POST" });
      if (!response.ok) {
        throw new Error("Não foi possível finalizar a participação. Tente novamente.");
      }
      router.push("/obrigado");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível finalizar a participação. Tente novamente.");
      setFinalizando(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <h1 className="mt-4 text-xl font-semibold text-zinc-900">Tarefa concluída</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Seus dados foram computados com sucesso. O que você gostaria de fazer agora?
        </p>

        {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Voltar à tela inicial
          </button>
          <button
            type="button"
            onClick={handleFinalizarParticipacao}
            disabled={finalizando}
            className="w-full rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50"
          >
            {finalizando ? "Finalizando..." : "Finalizar participação"}
          </button>
        </div>
      </div>
    </div>
  );
}
