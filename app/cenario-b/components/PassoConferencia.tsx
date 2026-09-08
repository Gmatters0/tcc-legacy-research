"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { useSessao } from "@/lib/instrumentation/SessaoProvider";
import { classificarTipoErroPorMensagem } from "@/lib/instrumentation/erros";
import { TipoEventoErro } from "@/lib/instrumentation/types";
import type { ItemConferencia } from "../types";

interface Props {
  notaFiscalId: string;
  itens: ItemConferencia[];
  onChangeItens: (itens: ItemConferencia[]) => void;
  onVoltar: () => void;
  onConcluido: (quantidadeTotal: number) => void;
}

const ITEM_VAZIO: ItemConferencia = {
  codigo: "",
  descricao: "",
  qtdPedidaTexto: "",
  qtdRecebidaTexto: "",
  unidade: "",
};

const ROTULOS_CAMPO: Record<keyof ItemConferencia, string> = {
  codigo: "código",
  descricao: "descrição",
  qtdPedidaTexto: "quantidade pedida",
  qtdRecebidaTexto: "quantidade recebida",
  unidade: "unidade",
};

// Preserva "vazio" (undefined) separado de "0" (número válido) até o submit.
function paraQuantidade(texto: string): number | undefined {
  return texto.trim() === "" ? undefined : Number(texto);
}

export function PassoConferencia({ notaFiscalId, itens, onChangeItens, onVoltar, onConcluido }: Props) {
  const { registrarErro } = useSessao();
  const [erros, setErros] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  const possuiDivergencia = useMemo(
    () =>
      itens.some((item) => {
        if (!item.qtdPedidaTexto.trim() || !item.qtdRecebidaTexto.trim()) return false;
        return Number(item.qtdPedidaTexto) !== Number(item.qtdRecebidaTexto);
      }),
    [itens],
  );

  function adicionarItem() {
    onChangeItens([...itens, { ...ITEM_VAZIO }]);
  }

  function removerItem(index: number) {
    onChangeItens(itens.filter((_, i) => i !== index));
  }

  function alterarItem(index: number, campo: keyof ItemConferencia, valor: string) {
    onChangeItens(itens.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)));
  }

  function validarCampoEmBlur(index: number, campo: keyof ItemConferencia, valor: string) {
    const detalhe = `cenario-b/conferencia.itens[${index}].${ROTULOS_CAMPO[campo]}`;
    if (!valor.trim()) {
      registrarErro(TipoEventoErro.INPUT_OBRIGATORIO_VAZIO, detalhe);
      return;
    }
    if (campo === "qtdPedidaTexto" || campo === "qtdRecebidaTexto") {
      const numero = Number(valor);
      if (Number.isNaN(numero) || numero <= 0) {
        registrarErro(TipoEventoErro.ERRO_VALIDACAO_CAMPO, detalhe);
      }
    }
  }

  async function handleConfirmar() {
    setErros([]);
    setEnviando(true);
    try {
      const response = await fetch(`/api/notas-fiscais/${notaFiscalId}/itens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens: itens.map((item) => ({
            codigo: item.codigo,
            descricao: item.descricao,
            qtdPedida: paraQuantidade(item.qtdPedidaTexto),
            qtdRecebida: paraQuantidade(item.qtdRecebidaTexto),
            unidade: item.unidade,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const listaErros: { campo: string; mensagem: string }[] = data.erros ?? [];
        listaErros.forEach((erro) =>
          registrarErro(classificarTipoErroPorMensagem(erro.mensagem), `cenario-b/conferencia.${erro.campo}`),
        );
        setErros(listaErros.map((erro) => erro.mensagem));
        return;
      }
      const quantidadeTotal = itens.reduce((soma, item) => soma + (Number(item.qtdRecebidaTexto) || 0), 0);
      onConcluido(quantidadeTotal);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex w-full max-w-[956px] flex-col gap-6">
      <div className="overflow-hidden rounded-2xl border border-[#c3c6d7] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#c3c6d7] bg-[#f3f3fe] px-6 py-4">
          <h2 className="text-xl font-semibold text-[#191b23]">Itens da Nota</h2>
          <button
            type="button"
            onClick={adicionarItem}
            className="flex items-center gap-1.5 rounded-lg bg-[#004ac6] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#003a9b]"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar Item
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[#faf8ff] text-xs font-semibold uppercase tracking-wide text-[#434655]">
            <tr>
              <th className="px-6 py-3 text-left">Código do Item</th>
              <th className="px-4 py-3 text-left">Descrição</th>
              <th className="px-4 py-3 text-center">Qtd. Pedida</th>
              <th className="px-4 py-3 text-center">Qtd. Recebida</th>
              <th className="px-4 py-3 text-left">Unidade</th>
              <th className="px-4 py-3 text-right">Status</th>
              <th className="px-6 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item, index) => {
              const divergente =
                item.qtdPedidaTexto.trim() !== "" &&
                item.qtdRecebidaTexto.trim() !== "" &&
                Number(item.qtdPedidaTexto) !== Number(item.qtdRecebidaTexto);
              return (
                <tr key={index} className="border-t border-[#c3c6d7]">
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      value={item.codigo}
                      onChange={(e) => alterarItem(index, "codigo", e.target.value)}
                      onBlur={(e) => validarCampoEmBlur(index, "codigo", e.target.value)}
                      placeholder="Ex: ITM-00124"
                      className="w-28 rounded-md border border-[#c3c6d7] px-2 py-1 text-[#191b23] focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={item.descricao}
                      onChange={(e) => alterarItem(index, "descricao", e.target.value)}
                      onBlur={(e) => validarCampoEmBlur(index, "descricao", e.target.value)}
                      placeholder="Descrição do item"
                      className="w-full min-w-[180px] rounded-md border border-[#c3c6d7] px-2 py-1 text-[#191b23] focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      value={item.qtdPedidaTexto}
                      onChange={(e) => alterarItem(index, "qtdPedidaTexto", e.target.value)}
                      onBlur={(e) => validarCampoEmBlur(index, "qtdPedidaTexto", e.target.value)}
                      className="w-20 rounded-md border border-[#c3c6d7] px-2 py-1 text-center text-[#191b23] focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      value={item.qtdRecebidaTexto}
                      onChange={(e) => alterarItem(index, "qtdRecebidaTexto", e.target.value)}
                      onBlur={(e) => validarCampoEmBlur(index, "qtdRecebidaTexto", e.target.value)}
                      className={`w-20 rounded-md border px-2 py-1 text-center text-[#191b23] focus:outline-none ${
                        divergente ? "border-[#b06000] bg-[rgba(254,247,224,0.3)]" : "border-[#c3c6d7]"
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={item.unidade}
                      onChange={(e) => alterarItem(index, "unidade", e.target.value)}
                      onBlur={(e) => validarCampoEmBlur(index, "unidade", e.target.value)}
                      placeholder="UN"
                      className="w-16 rounded-md border border-[#c3c6d7] px-2 py-1 text-[#191b23] focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.qtdPedidaTexto.trim() !== "" && item.qtdRecebidaTexto.trim() !== "" && (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          divergente ? "bg-[#fef7e0] text-[#b06000]" : "bg-[#e6f4ea] text-[#137333]"
                        }`}
                      >
                        {divergente ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                        {divergente ? "Divergência" : "Bateu"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => removerItem(index)}
                      aria-label="Remover item"
                      className="text-[#434655] hover:text-[#dc2626]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {itens.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-6 text-center text-sm text-[#434655]">
                  Nenhum item — clique em &quot;Adicionar Item&quot; para inserir.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {possuiDivergencia && (
        <div className="flex max-w-[672px] gap-3 rounded-xl border border-[rgba(176,96,0,0.3)] bg-[rgba(254,247,224,0.5)] p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-[#b06000]" />
          <div>
            <h4 className="text-sm font-bold text-[#b06000]">Atenção: Divergência Detectada</h4>
            <p className="text-xs text-[#434655]">
              Há itens com quantidade recebida diferente da pedida. A divergência foi registrada, mas você pode
              prosseguir com a conferência.
            </p>
          </div>
        </div>
      )}

      {erros.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erros.map((mensagem, index) => (
            <li key={index}>{mensagem}</li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between border-t border-[#c3c6d7] pt-6">
        <button
          type="button"
          onClick={onVoltar}
          className="rounded-lg border border-[#c3c6d7] px-6 py-2.5 text-sm font-medium text-[#191b23]"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={handleConfirmar}
          disabled={enviando}
          className="rounded-lg bg-[#004ac6] px-6 py-2.5 text-sm font-medium text-white shadow-sm disabled:opacity-50"
        >
          {enviando ? "Confirmando..." : "Próximo →"}
        </button>
      </div>
    </div>
  );
}
