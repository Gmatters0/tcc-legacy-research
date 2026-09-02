"use client";

import { useState, type FormEvent } from "react";
import type { UsuarioComHistorico } from "@/lib/business-logic/elegibilidade";

export function LoginForm({ onLogin }: { onLogin: (usuario: UsuarioComHistorico) => void }) {
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, senha }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErro(data.erros?.[0]?.mensagem ?? "Não foi possível entrar.");
        return;
      }
      onLogin(data);
    } catch {
      setErro("Não foi possível entrar. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-zinc-900">Pesquisa de Usabilidade — ERP</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Entre com o código e a senha fornecidos pelo pesquisador.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Código do participante
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ex: PJS-01"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Senha
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
            />
          </label>
        </div>

        {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="mt-6 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
