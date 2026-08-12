"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CENARIOS, CONJUNTOS_TAREFA, PERFIS_USUARIO } from "@/lib/task-config";
import { criarSessao } from "@/lib/instrumentation/session";
import type { PerfilUsuario } from "@/lib/instrumentation/types";

export default function Home() {
  const router = useRouter();
  const [participanteId, setParticipanteId] = useState("");
  const [perfilUsuario, setPerfilUsuario] = useState<PerfilUsuario | "">("");
  const [cenario, setCenario] = useState("");
  const [conjuntoTarefa, setConjuntoTarefa] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function iniciarTarefa(event: FormEvent) {
    event.preventDefault();
    if (!participanteId.trim() || !perfilUsuario || !cenario || !conjuntoTarefa) {
      setErro("Preencha todos os campos antes de iniciar a tarefa.");
      return;
    }

    setEnviando(true);
    setErro(null);
    try {
      const sessao = await criarSessao({
        participanteId: participanteId.trim(),
        perfilUsuario,
        cenario,
        conjuntoTarefa,
      });
      const destino = cenario === "A" ? "/cenario-a" : "/cenario-b";
      router.push(`${destino}?sessaoId=${sessao.id}`);
    } catch {
      setErro("Não foi possível iniciar a sessão de teste. Tente novamente.");
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <form
        onSubmit={iniciarTarefa}
        className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-zinc-900">Pesquisa de Usabilidade — ERP</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Preencha os dados abaixo para iniciar a sessão de teste.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Código do participante
            <input
              type="text"
              value={participanteId}
              onChange={(e) => setParticipanteId(e.target.value)}
              placeholder="Ex: P01"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Perfil do usuário
            <select
              value={perfilUsuario}
              onChange={(e) => setPerfilUsuario(e.target.value as PerfilUsuario)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
            >
              <option value="">Selecione...</option>
              {PERFIS_USUARIO.map((perfil) => (
                <option key={perfil.value} value={perfil.value}>
                  {perfil.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Cenário
            <select
              value={cenario}
              onChange={(e) => setCenario(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
            >
              <option value="">Selecione...</option>
              {CENARIOS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Conjunto de tarefa
            <select
              value={conjuntoTarefa}
              onChange={(e) => setConjuntoTarefa(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
            >
              <option value="">Selecione...</option>
              {CONJUNTOS_TAREFA.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="mt-6 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          {enviando ? "Iniciando..." : "Iniciar Tarefa"}
        </button>
      </form>
    </div>
  );
}
