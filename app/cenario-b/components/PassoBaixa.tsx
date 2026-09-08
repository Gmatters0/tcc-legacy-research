"use client";

import { useRef, useState, type FormEvent } from "react";
import { ExternalLink, Loader2, Package, Save, ShieldCheck } from "lucide-react";
import { useSessao } from "@/lib/instrumentation/SessaoProvider";
import { classificarTipoErroPorMensagem } from "@/lib/instrumentation/erros";
import { TipoEventoErro } from "@/lib/instrumentation/types";
import { ARMAZENS_DISPONIVEIS } from "@/lib/task-config";
import type { FormBaixa, NotaFiscalResumo } from "../types";

interface Props {
  notaFiscal: NotaFiscalResumo;
  quantidadeSugerida: number;
  form: FormBaixa;
  onChangeForm: (form: FormBaixa) => void;
  onVoltar: () => void;
  onConcluido: () => void;
}

export function PassoBaixa({ notaFiscal, quantidadeSugerida, form, onChangeForm, onVoltar, onConcluido }: Props) {
  const { registrarErro, finalizarSessao } = useSessao();
  const { armazem, lote, quantidade } = form;
  const [erros, setErros] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  // Guarda síncrono, independente do ciclo de render do React — bloqueia
  // duplo clique/duplo submit mesmo no instante entre o clique e o
  // `disabled` do botão realmente refletir no DOM.
  const enviandoRef = useRef(false);

  function setArmazem(valor: string) {
    onChangeForm({ ...form, armazem: valor });
  }
  function setLote(valor: string) {
    onChangeForm({ ...form, lote: valor });
  }
  function setQuantidade(valor: string) {
    onChangeForm({ ...form, quantidade: valor });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (enviandoRef.current) return;
    setErros([]);

    if (!armazem) {
      registrarErro(TipoEventoErro.INPUT_OBRIGATORIO_VAZIO, "cenario-b/baixa.armazem");
      setErros(["Selecione um armazém de destino."]);
      return;
    }
    if (!lote.trim()) {
      registrarErro(TipoEventoErro.INPUT_OBRIGATORIO_VAZIO, "cenario-b/baixa.lote");
      setErros(["Informe o lote."]);
      return;
    }

    enviandoRef.current = true;
    setEnviando(true);
    try {
      const response = await fetch(`/api/notas-fiscais/${notaFiscal.id}/baixa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ armazem, lote, quantidade: Number(quantidade) }),
      });
      const data = await response.json();
      if (!response.ok) {
        const listaErros: { campo: string; mensagem: string }[] = data.erros ?? [];
        listaErros.forEach((erro) =>
          registrarErro(classificarTipoErroPorMensagem(erro.mensagem), `cenario-b/baixa.${erro.campo}`),
        );
        setErros(
          listaErros.length ? listaErros.map((erro) => erro.mensagem) : ["Não foi possível registrar a baixa."],
        );
        return;
      }
      await finalizarSessao();
      onConcluido();
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  return (
    <div className="flex w-full max-w-[956px] items-start gap-6">
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6">
        <div className="overflow-hidden rounded-xl border border-[#c3c6d7] bg-white shadow-sm">
          <div className="border-b border-[#c3c6d7] bg-[rgba(250,248,255,0.5)] px-6 py-6">
            <h2 className="text-xl font-semibold text-[#191b23]">Detalhes do Lançamento</h2>
            <p className="text-xs text-[#434655]">
              Preencha os dados de destino para efetivar a entrada dos itens conferidos.
            </p>
          </div>

          <div className="flex flex-col gap-6 p-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#191b23]">Armazém/Depósito de destino *</label>
                <select
                  value={armazem}
                  onChange={(e) => setArmazem(e.target.value)}
                  className="rounded-lg border border-[#737686] px-3 py-2.5 text-sm text-[#191b23] focus:outline-none"
                >
                  <option value="">Selecione um depósito</option>
                  {ARMAZENS_DISPONIVEIS.map((deposito) => (
                    <option key={deposito.codigo} value={`${deposito.codigo} - ${deposito.nome}`}>
                      {deposito.codigo} - {deposito.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#191b23]">Lote</label>
                <input
                  type="text"
                  value={lote}
                  onChange={(e) => setLote(e.target.value)}
                  placeholder="Ex: Lote de Estoque A"
                  className="rounded-lg border border-[#737686] px-3 py-2.5 text-sm text-[#191b23] placeholder:text-[#6b7280] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#191b23]">Quantidade a lançar</label>
                <input
                  type="number"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  className="rounded-lg border border-[#c3c6d7] bg-[#ededf9] px-3 py-2.5 text-sm text-[#434655] focus:outline-none"
                />
                <p className="text-xs text-[#434655]">Valor calculado a partir da conferência (Passo 2).</p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#191b23]">Status Final</label>
                <div className="flex h-[42px] items-center rounded-lg border border-[#c3c6d7] bg-[#ededf9] px-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d0e1fb] px-2.5 py-1 text-xs font-medium text-[#54647a]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#004ac6]" />
                    Pendente
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 rounded-lg border border-[#c3c6d7] bg-[#f3f3fe] p-4">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#191b23]" />
              <div>
                <p className="text-sm font-medium text-[#191b23]">Confirmação de Integridade</p>
                <p className="text-xs text-[#434655]">
                  A liberação do lote só é permitida pois todos os itens da Etapa 2 foram conferidos.
                </p>
              </div>
            </div>
          </div>

          {erros.length > 0 && (
            <ul className="flex flex-col gap-1 px-6 pb-4 text-sm text-red-600">
              {erros.map((mensagem, index) => (
                <li key={index}>{mensagem}</li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between border-t border-[#c3c6d7] px-6 py-6">
            <button
              type="button"
              onClick={onVoltar}
              className="rounded-lg border border-[#737686] px-5 py-2 text-sm font-medium text-[#191b23]"
            >
              Anterior
            </button>
            <button
              type="submit"
              disabled={enviando}
              aria-busy={enviando}
              className="flex items-center gap-2 rounded-lg bg-[#16a34a] px-6 py-2 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {enviando ? "Salvando..." : "Salvar Lançamento"}
            </button>
          </div>
        </div>
      </form>

      <aside className="flex w-[320px] flex-col gap-4">
        <div className="rounded-xl border border-[#c3c6d7] bg-white p-4 shadow-sm">
          <h3 className="border-b border-[#c3c6d7] pb-2 text-sm font-bold text-[#191b23]">Resumo da Nota Fiscal</h3>
          <div className="flex items-center gap-3 pt-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-[#2563eb]">
              <Package className="h-[18px] w-[18px] text-white" />
            </div>
            <div>
              <p className="text-base font-semibold text-[#191b23]">NF #{notaFiscal.numero}</p>
              <p className="text-xs text-[#434655]">{notaFiscal.fornecedor}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-3 text-xs">
            <div className="flex justify-between">
              <span className="text-[#434655]">Data Emissão:</span>
              <span className="font-semibold text-[#191b23]">
                {new Date(notaFiscal.dataEmissao).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#434655]">Valor Total:</span>
              <span className="font-semibold text-[#191b23]">
                {notaFiscal.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#434655]">Qtd. Itens:</span>
              <span className="font-semibold text-[#191b23]">{quantidadeSugerida} un.</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#c3c6d7] bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-[#191b23]">Ajuda</h3>
          <p className="pt-2 text-xs text-[#434655]">
            Ao clicar em &apos;Salvar Lançamento&apos;, os itens serão adicionados ao estoque e o saldo financeiro
            será atualizado no módulo de Custos.
          </p>
          <span className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#004ac6]">
            Ver manual de processos
            <ExternalLink className="h-2.5 w-2.5" />
          </span>
        </div>
      </aside>
    </div>
  );
}
