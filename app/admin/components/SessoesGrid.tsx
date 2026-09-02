"use client";

import { TipoEventoErro } from "@/lib/instrumentation/types";
import type { LinhaRelatorioAdmin } from "../types";

function formatarDuracao(segundos: number | null): string {
  if (segundos === null) return "—";
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${minutos}m ${resto}s`;
}

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR");
}

export function SessoesGrid({ linhas }: { linhas: LinhaRelatorioAdmin[] }) {
  const tipos = Object.values(TipoEventoErro);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">Sessões ({linhas.length})</h2>
        <div className="flex gap-2 text-sm">
          <a
            href="/api/admin/export?formato=csv"
            className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Exportar tudo — CSV
          </a>
          <a
            href="/api/admin/export?formato=json"
            className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Exportar tudo — JSON
          </a>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="bg-zinc-50 text-left text-xs font-medium uppercase text-zinc-500">
            <tr>
              <th className="border-b border-zinc-200 px-3 py-2">Participante</th>
              <th className="border-b border-zinc-200 px-3 py-2">Perfil</th>
              <th className="border-b border-zinc-200 px-3 py-2">Cenário</th>
              <th className="border-b border-zinc-200 px-3 py-2">Conjunto</th>
              <th className="border-b border-zinc-200 px-3 py-2">Início</th>
              <th className="border-b border-zinc-200 px-3 py-2">Duração</th>
              {tipos.map((tipo) => (
                <th key={tipo} className="border-b border-zinc-200 px-3 py-2 text-right" title={tipo}>
                  {tipo}
                </th>
              ))}
              <th className="border-b border-zinc-200 px-3 py-2 text-right">Total Erros</th>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr>
                <td colSpan={7 + tipos.length} className="px-3 py-6 text-center text-zinc-400">
                  Nenhuma sessão registrada ainda.
                </td>
              </tr>
            )}
            {linhas.map((linha) => (
              <tr key={linha.sessaoId} className="border-b border-zinc-100 last:border-0">
                <td className="px-3 py-2 font-medium text-zinc-900">{linha.usuarioCodigo}</td>
                <td className="px-3 py-2 text-zinc-600">{linha.perfilUsuario}</td>
                <td className="px-3 py-2 text-zinc-600">{linha.cenario}</td>
                <td className="px-3 py-2 text-zinc-600">{linha.conjuntoTarefa}</td>
                <td className="px-3 py-2 text-zinc-600">{formatarData(linha.timestampInicio)}</td>
                <td className="px-3 py-2 text-zinc-600">
                  {linha.timestampFim ? formatarDuracao(linha.duracaoSegundos) : "em andamento"}
                </td>
                {tipos.map((tipo) => (
                  <td key={tipo} className="px-3 py-2 text-right text-zinc-600">
                    {linha.eventosPorTipo[tipo] ?? 0}
                  </td>
                ))}
                <td className="px-3 py-2 text-right font-medium text-zinc-900">{linha.totalEventosErro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
