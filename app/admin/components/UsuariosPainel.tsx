"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { UsuarioAdmin } from "../types";

export function UsuariosPainel() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[] | null>(null);
  const [iniciais, setIniciais] = useState("");
  const [criando, setCriando] = useState(false);
  const [erroCriacao, setErroCriacao] = useState<string | null>(null);
  const [usuarioCriado, setUsuarioCriado] = useState<{ codigo: string; senha: string } | null>(null);

  async function carregarUsuarios() {
    const response = await fetch("/api/admin/usuarios");
    if (response.ok) setUsuarios(await response.json());
  }

  useEffect(() => {
    fetch("/api/admin/usuarios")
      .then((response) => (response.ok ? response.json() : []))
      .then(setUsuarios);
  }, []);

  async function handleCriar(event: FormEvent) {
    event.preventDefault();
    setErroCriacao(null);
    setCriando(true);
    try {
      const response = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iniciais }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErroCriacao(data.erros?.[0]?.mensagem ?? "Não foi possível criar o usuário.");
        return;
      }
      setUsuarioCriado({ codigo: data.usuario.codigo, senha: data.senha });
      setIniciais("");
      await carregarUsuarios();
    } finally {
      setCriando(false);
    }
  }

  async function handleAlternarAtivo(usuario: UsuarioAdmin) {
    await fetch(`/api/admin/usuarios/${usuario.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !usuario.ativo }),
    });
    await carregarUsuarios();
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-zinc-900">Usuários</h2>

      <form
        onSubmit={handleCriar}
        className="flex items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4"
      >
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Iniciais do participante (nome e sobrenome)
          <input
            type="text"
            value={iniciais}
            onChange={(e) => setIniciais(e.target.value)}
            placeholder="Ex: JS"
            className="w-32 rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={criando}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          {criando ? "Criando..." : "Criar usuário"}
        </button>
        {erroCriacao && <p className="text-sm text-red-600">{erroCriacao}</p>}
      </form>

      {usuarioCriado && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm">
          <p className="text-emerald-900">
            Usuário <span className="font-semibold">{usuarioCriado.codigo}</span> criado — senha:{" "}
            <span className="font-mono font-semibold">{usuarioCriado.senha}</span>. Anote agora, ela não será
            mostrada de novo.
          </p>
          <button
            type="button"
            onClick={() => setUsuarioCriado(null)}
            className="ml-4 shrink-0 font-medium text-emerald-700 underline underline-offset-2"
          >
            fechar
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-zinc-50 text-left text-xs font-medium uppercase text-zinc-500">
            <tr>
              <th className="border-b border-zinc-200 px-3 py-2">Código</th>
              <th className="border-b border-zinc-200 px-3 py-2">Status</th>
              <th className="border-b border-zinc-200 px-3 py-2">Criado em</th>
              <th className="border-b border-zinc-200 px-3 py-2">Cenários concluídos</th>
              <th className="border-b border-zinc-200 px-3 py-2">Conjuntos concluídos</th>
              <th className="border-b border-zinc-200 px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios === null && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-zinc-400">
                  Carregando...
                </td>
              </tr>
            )}
            {usuarios?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-zinc-400">
                  Nenhum usuário cadastrado ainda.
                </td>
              </tr>
            )}
            {usuarios?.map((usuario) => (
              <tr key={usuario.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-3 py-2 font-medium text-zinc-900">{usuario.codigo}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      usuario.ativo ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-600"
                    }`}
                  >
                    {usuario.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-3 py-2 text-zinc-600">
                  {new Date(usuario.createdAt).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-3 py-2 text-zinc-600">
                  {usuario.historico.cenariosConcluidos.join(", ") || "—"}
                </td>
                <td className="px-3 py-2 text-zinc-600">
                  {usuario.historico.conjuntosTarefaConcluidos.join(", ") || "—"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleAlternarAtivo(usuario)}
                      className="font-medium text-zinc-700 underline underline-offset-2"
                    >
                      {usuario.ativo ? "Desativar" : "Reativar"}
                    </button>
                    <a
                      href={`/api/admin/export?formato=csv&usuarioId=${usuario.id}`}
                      className="font-medium text-zinc-700 underline underline-offset-2"
                    >
                      CSV
                    </a>
                    <a
                      href={`/api/admin/export?formato=json&usuarioId=${usuario.id}`}
                      className="font-medium text-zinc-700 underline underline-offset-2"
                    >
                      JSON
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
