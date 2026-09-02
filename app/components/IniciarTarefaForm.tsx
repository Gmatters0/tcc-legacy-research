"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CENARIOS, CONJUNTOS_TAREFA, PERFIS_USUARIO } from "@/lib/task-config";
import { criarSessao } from "@/lib/instrumentation/session";
import type { PerfilUsuario } from "@/lib/instrumentation/types";
import type { UsuarioComHistorico } from "@/lib/business-logic/elegibilidade";

export function IniciarTarefaForm({
  usuario,
  onLogout,
}: {
  usuario: UsuarioComHistorico;
  onLogout: () => void;
}) {
  const router = useRouter();

  // Regra de não-repetição (ver lib/business-logic/elegibilidade.ts): cenário e
  // conjunto de tarefa já concluídos por este usuário saem das opções. Se
  // sobra só um de cada, ele já vem selecionado e o campo trava — o usuário
  // não consegue escolher de volta o que já fez.
  const cenariosDisponiveis = CENARIOS.filter((c) => !usuario.cenariosConcluidos.includes(c.value));
  const conjuntosDisponiveis = CONJUNTOS_TAREFA.filter(
    (c) => !usuario.conjuntosTarefaConcluidos.includes(c.value),
  );
  const participacaoConcluida = cenariosDisponiveis.length === 0 || conjuntosDisponiveis.length === 0;

  const [perfilUsuario, setPerfilUsuario] = useState<PerfilUsuario | "">("");
  const [cenario, setCenario] = useState(cenariosDisponiveis.length === 1 ? cenariosDisponiveis[0].value : "");
  const [conjuntoTarefa, setConjuntoTarefa] = useState(
    conjuntosDisponiveis.length === 1 ? conjuntosDisponiveis[0].value : "",
  );
  const [enviando, setEnviando] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function iniciarTarefa(event: FormEvent) {
    event.preventDefault();
    if (!perfilUsuario || !cenario || !conjuntoTarefa) {
      setErro("Preencha todos os campos antes de iniciar a tarefa.");
      return;
    }

    setEnviando(true);
    setErro(null);
    try {
      const sessao = await criarSessao({ perfilUsuario, cenario, conjuntoTarefa });
      const destino = cenario === "A" ? "/cenario-a" : "/cenario-b";
      router.push(`${destino}?sessaoId=${sessao.id}`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível iniciar a sessão de teste. Tente novamente.");
      setEnviando(false);
    }
  }

  async function handleLogout() {
    setSaindo(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      onLogout();
    }
  }

  const usuarioLogado = (
    <p className="mt-2 text-sm text-zinc-500">
      Logado como <span className="font-medium text-zinc-900">{usuario.codigo}</span>
      {" — "}
      <button
        type="button"
        onClick={handleLogout}
        disabled={saindo}
        className="font-medium text-zinc-700 underline underline-offset-2 disabled:opacity-50"
      >
        sair
      </button>
    </p>
  );

  if (participacaoConcluida) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
        <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Pesquisa de Usabilidade — ERP</h1>
          {usuarioLogado}
          <p className="mt-6 text-sm text-zinc-600">
            Você já concluiu sua participação nesta pesquisa — obrigado! Não há mais cenários ou
            conjuntos de tarefa disponíveis para o seu usuário.
          </p>
        </div>
      </div>
    );
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
        {usuarioLogado}

        <div className="mt-6 flex flex-col gap-4">
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
              disabled={cenariosDisponiveis.length === 1}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-500"
            >
              {cenariosDisponiveis.length > 1 && <option value="">Selecione...</option>}
              {cenariosDisponiveis.map((c) => (
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
              disabled={conjuntosDisponiveis.length === 1}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-500"
            >
              {conjuntosDisponiveis.length > 1 && <option value="">Selecione...</option>}
              {conjuntosDisponiveis.map((c) => (
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
