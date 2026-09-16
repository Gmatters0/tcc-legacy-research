"use client";

import { Fragment, useState } from "react";
import { TipoEventoErro } from "@/lib/instrumentation/types";
import { SUS_ITENS, SUBJETIVO_ITENS, TLX_ITENS, type TlxChave } from "@/lib/avaliacao-config";
import type { AvaliacaoAdmin, LinhaRelatorioAdmin } from "../types";

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

const CAMPOS_SUS = Array.from({ length: 10 }, (_, i) => `susQ${i + 1}` as keyof AvaliacaoAdmin);
const CAMPOS_SUBJ = Array.from({ length: 10 }, (_, i) => `subjQ${i + 1}` as keyof AvaliacaoAdmin);
const CAMPOS_TLX: Record<TlxChave, keyof AvaliacaoAdmin> = {
  mental: "tlxMental",
  fisica: "tlxFisica",
  temporal: "tlxTemporal",
  desempenho: "tlxDesempenho",
  esforco: "tlxEsforco",
  frustracao: "tlxFrustracao",
};

function DetalheAvaliacao({ linha }: { linha: LinhaRelatorioAdmin }) {
  if (!linha.avaliacao) {
    return <p className="text-sm text-zinc-400">Sessão ainda não avaliada (Avaliação Pós-Tarefa não concluída).</p>;
  }
  const a = linha.avaliacao;

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase text-zinc-500">
            NASA-TLX — score {a.tlxScore.toFixed(1)}
          </h4>
          <ul className="flex flex-col gap-1">
            {TLX_ITENS.map((item) => (
              <li key={item.chave} className="flex justify-between gap-2" title={item.descricao}>
                <span className="text-zinc-600">{item.titulo}</span>
                <span className="font-medium text-zinc-900">{a[CAMPOS_TLX[item.chave]]}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase text-zinc-500">
            SUS — score {a.susScore.toFixed(1)}
          </h4>
          <ul className="flex flex-col gap-1">
            {SUS_ITENS.map((pergunta, i) => (
              <li key={i} className="flex justify-between gap-2" title={pergunta}>
                <span className="truncate text-zinc-600">
                  {i + 1}. {pergunta}
                </span>
                <span className="shrink-0 font-medium text-zinc-900">{a[CAMPOS_SUS[i]]}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase text-zinc-500">Subjetivo (1-5)</h4>
          <ul className="flex flex-col gap-1">
            {SUBJETIVO_ITENS.map((pergunta, i) => (
              <li key={i} className="flex justify-between gap-2" title={pergunta}>
                <span className="truncate text-zinc-600">
                  {i + 1}. {pergunta}
                </span>
                <span className="shrink-0 font-medium text-zinc-900">{a[CAMPOS_SUBJ[i]]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {linha.comparacaoFinal && (
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <h4 className="mb-1 text-xs font-semibold uppercase text-zinc-500">
            Comparação final do participante — preferiu {linha.comparacaoFinal.preferencia}
          </h4>
          <p className="text-zinc-700">{linha.comparacaoFinal.porque}</p>
          {linha.comparacaoFinal.feedback && (
            <p className="mt-1 text-zinc-500 italic">{linha.comparacaoFinal.feedback}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function SessoesGrid({ linhas }: { linhas: LinhaRelatorioAdmin[] }) {
  const tipos = Object.values(TipoEventoErro);
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());

  function alternarExpandida(sessaoId: string) {
    setExpandidas((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(sessaoId)) proximo.delete(sessaoId);
      else proximo.add(sessaoId);
      return proximo;
    });
  }

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
              <th className="border-b border-zinc-200 px-3 py-2 text-right">NASA-TLX</th>
              <th className="border-b border-zinc-200 px-3 py-2 text-right">SUS</th>
              <th className="border-b border-zinc-200 px-3 py-2">Avaliação</th>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr>
                <td colSpan={10 + tipos.length} className="px-3 py-6 text-center text-zinc-400">
                  Nenhuma sessão registrada ainda.
                </td>
              </tr>
            )}
            {linhas.map((linha) => {
              const expandida = expandidas.has(linha.sessaoId);
              return (
                <Fragment key={linha.sessaoId}>
                  <tr className="border-b border-zinc-100 last:border-0">
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
                    <td className="px-3 py-2 text-right text-zinc-600">
                      {linha.avaliacao ? linha.avaliacao.tlxScore.toFixed(1) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-zinc-600">
                      {linha.avaliacao ? linha.avaliacao.susScore.toFixed(1) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => alternarExpandida(linha.sessaoId)}
                        className="font-medium text-zinc-700 underline underline-offset-2"
                      >
                        {expandida ? "Ocultar" : "Ver detalhes"}
                      </button>
                    </td>
                  </tr>
                  {expandida && (
                    <tr className="border-b border-zinc-100 bg-zinc-50/60 last:border-0">
                      <td colSpan={10 + tipos.length} className="px-4 py-4">
                        <DetalheAvaliacao linha={linha} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
