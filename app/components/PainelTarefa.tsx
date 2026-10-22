"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import { CONJUNTOS_TAREFA, DADOS_TAREFA, type DadosTarefa } from "@/lib/task-config";

// Faixa com os dados da nota fiscal da tarefa (o que antes era entregue em
// papel/mensagem), colada na base da página durante os dois cenários — o
// participante faz a tarefa sem o pesquisador por perto. Fica NO FLUXO da
// página (sticky), não sobreposta: empurra o conteúdo em vez de cobrir campos
// ou botões. É material de apoio, não parte do sistema avaliado: visual neutro
// e idêntico em A e B, e minimizar/expandir NÃO gera EventoErro.
export function PainelTarefa({ sessaoId }: { sessaoId: string | null }) {
  const [conjunto, setConjunto] = useState<{ rotulo: string; dados: DadosTarefa } | null>(null);
  const [aberto, setAberto] = useState(true);

  useEffect(() => {
    if (!sessaoId) return;
    fetch(`/api/sessoes/${sessaoId}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((sessao: { conjuntoTarefa: string } | null) => {
        const dados = sessao ? DADOS_TAREFA[sessao.conjuntoTarefa] : undefined;
        const rotulo = CONJUNTOS_TAREFA.find((c) => c.value === sessao?.conjuntoTarefa)?.label;
        if (dados && rotulo) setConjunto({ rotulo, dados });
      })
      .catch(() => {});
  }, [sessaoId]);

  if (!conjunto) return null;
  const { rotulo, dados } = conjunto;

  return (
    <aside
      aria-label="Dados da tarefa"
      className="sticky bottom-0 z-30 border-t-2 border-zinc-900 bg-white text-zinc-900 shadow-[0_-4px_12px_rgba(0,0,0,0.12)]"
    >
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        aria-expanded={aberto}
        aria-label={aberto ? "Minimizar dados da tarefa" : "Expandir dados da tarefa"}
        className="flex w-full cursor-pointer items-center justify-between bg-zinc-900 px-4 py-1.5 text-left text-sm font-semibold text-white hover:bg-zinc-700"
      >
        <span className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Dados da tarefa — {rotulo}
        </span>
        {aberto ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </button>

      {aberto && (
        <div className="flex flex-col gap-2 px-4 py-3 text-xs">
          <p className="italic text-zinc-600">{dados.instrucao}</p>

          <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
              <dt className="text-zinc-500">Nota Fiscal nº</dt>
              <dd className="font-semibold">{dados.numeroNf}</dd>
              <dt className="text-zinc-500">Fornecedor</dt>
              <dd className="font-semibold">{dados.fornecedor}</dd>
              <dt className="text-zinc-500">Data de emissão</dt>
              <dd className="font-semibold">{dados.dataEmissao}</dd>
              <dt className="text-zinc-500">Valor total</dt>
              <dd className="font-semibold">{dados.valorTotal}</dd>
            </dl>

            <table className="min-w-[24rem] flex-1 border-collapse">
              <thead>
                <tr className="border-b border-zinc-300 text-left text-[10px] uppercase text-zinc-500">
                  <th className="py-0.5 pr-3 font-medium">Código</th>
                  <th className="py-0.5 pr-3 font-medium">Descrição</th>
                  <th className="py-0.5 pr-3 font-medium">Un.</th>
                  <th className="py-0.5 pr-3 text-right font-medium">Qtd. pedida</th>
                  <th className="py-0.5 text-right font-medium">Qtd. recebida</th>
                </tr>
              </thead>
              <tbody>
                {dados.itens.map((item) => (
                  <tr key={item.codigo} className="border-b border-zinc-100">
                    <td className="py-0.5 pr-3 font-mono">{item.codigo}</td>
                    <td className="py-0.5 pr-3">{item.descricao}</td>
                    <td className="py-0.5 pr-3">{item.unidade}</td>
                    <td className="py-0.5 pr-3 text-right tabular-nums">{item.qtdPedida}</td>
                    <td className="py-0.5 text-right tabular-nums">{item.qtdRecebida}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 rounded-md bg-zinc-50 p-2">
              <dt className="text-zinc-500">Depósito de destino</dt>
              <dd className="font-semibold">
                {dados.deposito.codigo} – {dados.deposito.nome}
              </dd>
              <dt className="text-zinc-500">Lote</dt>
              <dd className="font-semibold">{dados.lote}</dd>
            </dl>
          </div>
        </div>
      )}
    </aside>
  );
}
