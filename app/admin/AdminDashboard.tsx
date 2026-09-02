"use client";

import { useEffect, useState } from "react";
import { SessoesGrid } from "./components/SessoesGrid";
import { UsuariosPainel } from "./components/UsuariosPainel";
import type { LinhaRelatorioAdmin } from "./types";

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [linhas, setLinhas] = useState<LinhaRelatorioAdmin[] | null>(null);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    fetch("/api/admin/sessoes")
      .then((response) => (response.ok ? response.json() : []))
      .then(setLinhas);
  }, []);

  async function handleLogout() {
    setSaindo(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      onLogout();
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Painel Administrativo</h1>
        <button
          type="button"
          onClick={handleLogout}
          disabled={saindo}
          className="text-sm font-medium text-zinc-700 underline underline-offset-2 disabled:opacity-50"
        >
          sair
        </button>
      </div>

      <UsuariosPainel />
      <SessoesGrid linhas={linhas ?? []} />
    </div>
  );
}
