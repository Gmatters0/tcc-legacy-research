"use client";

import { Plus, Search, Trash2 } from "lucide-react";
import type { ItemConferenciaA } from "../types";

interface Props {
  itens: ItemConferenciaA[];
  selecionados: Set<number>;
  onAlterarItem: (index: number, campo: keyof ItemConferenciaA, valor: string) => void;
  onAlternarSelecao: (index: number) => void;
  onNovoItem: () => void;
  onExcluirSelecionados: () => void;
  onPesquisarDecorativo: () => void;
}

export function FieldsetConferencia({
  itens,
  selecionados,
  onAlterarItem,
  onAlternarSelecao,
  onNovoItem,
  onExcluirSelecionados,
  onPesquisarDecorativo,
}: Props) {
  return (
    <fieldset className="border border-[#727780] p-2">
      <legend className="px-1 text-[11px] font-bold text-black">2. Conferência de Itens</legend>
      <div className="flex gap-1 px-1 pb-1">
        <button
          type="button"
          onClick={onNovoItem}
          className="flex items-center gap-1 border border-white bg-[#d2d2d2] px-2 py-0.5 text-xs text-[#1b1c1c]"
        >
          <Plus className="h-3 w-3" />
          Novo
        </button>
        <button
          type="button"
          onClick={onExcluirSelecionados}
          className="flex items-center gap-1 border border-white bg-[#d2d2d2] px-2 py-0.5 text-xs text-[#1b1c1c]"
        >
          <Trash2 className="h-3 w-3" />
          Excluir
        </button>
        <button
          type="button"
          onClick={onPesquisarDecorativo}
          className="flex items-center gap-1 border border-white bg-[#d2d2d2] px-2 py-0.5 text-xs text-[#1b1c1c]"
        >
          <Search className="h-3 w-3" />
          Pesquisar
        </button>
      </div>
      <div className="mx-1 mb-1 overflow-auto border border-[#9ca3af] bg-white">
        <table className="w-full border-collapse text-[11px]">
          <thead className="bg-[#d2d2d2]">
            <tr>
              <th className="w-6 border border-white p-1"></th>
              <th className="w-24 border border-white px-1 py-1.5 text-left font-normal">Cód. Item</th>
              <th className="border border-white px-1 py-1.5 text-left font-normal">Descrição</th>
              <th className="w-16 border border-white px-1 py-1.5 text-right font-normal">Qtd. Pedida</th>
              <th className="w-16 border border-white px-1 py-1.5 text-right font-normal">Qtd. Recebida</th>
              <th className="w-14 border border-white px-1 py-1.5 text-center font-normal">Un.</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item, index) => (
              <tr key={index}>
                <td className="border border-[#a0a0a0] p-1 text-center">
                  <input
                    type="checkbox"
                    checked={selecionados.has(index)}
                    onChange={() => onAlternarSelecao(index)}
                    className="h-3 w-3"
                  />
                </td>
                <td className="border border-[#a0a0a0] p-0">
                  <input
                    type="text"
                    value={item.codigo}
                    onChange={(e) => onAlterarItem(index, "codigo", e.target.value)}
                    className="w-full px-1 py-1.5 text-[11px] text-[#1b1c1c] focus:outline-none"
                  />
                </td>
                <td className="border border-[#a0a0a0] p-0">
                  <input
                    type="text"
                    value={item.descricao}
                    onChange={(e) => onAlterarItem(index, "descricao", e.target.value)}
                    className="w-full px-1 py-1.5 text-[11px] text-[#1b1c1c] focus:outline-none"
                  />
                </td>
                <td className="border border-[#a0a0a0] p-0">
                  <input
                    type="number"
                    value={item.qtdPedidaTexto}
                    onChange={(e) => onAlterarItem(index, "qtdPedidaTexto", e.target.value)}
                    className="w-full px-1 py-1.5 text-right text-base text-[#1b1c1c] focus:outline-none"
                  />
                </td>
                <td className="border border-[#a0a0a0] p-0">
                  <input
                    type="number"
                    value={item.qtdRecebidaTexto}
                    onChange={(e) => onAlterarItem(index, "qtdRecebidaTexto", e.target.value)}
                    className="w-full px-1 py-1.5 text-right text-base text-[#1b1c1c] focus:outline-none"
                  />
                </td>
                <td className="border border-[#a0a0a0] p-0">
                  <input
                    type="text"
                    value={item.unidade}
                    onChange={(e) => onAlterarItem(index, "unidade", e.target.value)}
                    className="w-full px-1 py-1.5 text-center text-[11px] text-[#1b1c1c] focus:outline-none"
                  />
                </td>
              </tr>
            ))}
            {itens.length === 0 && (
              <tr>
                <td colSpan={6} className="border border-[#a0a0a0] px-2 py-2 text-center text-[#727780]">
                  Nenhum item — use &quot;Novo&quot; para inserir.
                </td>
              </tr>
            )}
            {Array.from({ length: 2 }).map((_, i) => (
              <tr key={`vazia-${i}`}>
                <td className="h-[17px] border border-[#a0a0a0]" colSpan={6} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </fieldset>
  );
}
