"use client";

import { useState, type FormEvent } from "react";

export function AdminLoginForm({ onLogin }: { onLogin: () => void }) {
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setErro(data?.erros?.[0]?.mensagem ?? "Não foi possível entrar.");
        return;
      }
      onLogin();
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
        className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-zinc-900">Painel Administrativo</h1>
        <p className="mt-1 text-sm text-zinc-500">Acesso restrito ao pesquisador responsável.</p>

        <label className="mt-6 flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Senha
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoFocus
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
          />
        </label>

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
