"use client";

import { useState } from "react";
import { SessoesGrid } from "./components/SessoesGrid";
import { UsuariosPainel } from "./components/UsuariosPainel";

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [saindo, setSaindo] = useState(false);

  async function handleLogout() {
    setSaindo(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      onLogout();
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 bg-zinc-50 px-6 py-10">
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
      <SessoesGrid />
    </div>
  );
}
