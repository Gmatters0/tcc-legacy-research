"use client";

import { useState, type FormEvent } from "react";
import { Info } from "lucide-react";
import { useSessao } from "@/lib/instrumentation/SessaoProvider";
import { classificarTipoErroPorMensagem } from "@/lib/instrumentation/erros";
import { TipoEventoErro } from "@/lib/instrumentation/types";
import type { NotaFiscalResumo } from "../types";

interface Props {
  onConcluido: (notaFiscal: NotaFiscalResumo) => void;
}

interface FormState {
  numero: string;
  fornecedor: string;
  dataEmissao: string;
  valorTotal: string;
}

const VALOR_INICIAL: FormState = { numero: "", fornecedor: "", dataEmissao: "", valorTotal: "" };

export function PassoValidacao({ onConcluido }: Props) {
  const { registrarErro } = useSessao();
  const [form, setForm] = useState<FormState>(VALOR_INICIAL);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  function validarCampo(campo: keyof FormState, valor: string) {
    if (!valor.trim()) {
      registrarErro(TipoEventoErro.INPUT_OBRIGATORIO_VAZIO, `cenario-b/validacao.${campo}`);
      return "Campo obrigatório.";
    }
    if (campo === "numero" && !/^\d+$/.test(valor.trim())) {
      registrarErro(TipoEventoErro.ERRO_VALIDACAO_CAMPO, `cenario-b/validacao.${campo}`);
      return "Número da NF deve conter apenas números.";
    }
    if (campo === "valorTotal") {
      const numero = Number(valor.replace(",", "."));
      if (Number.isNaN(numero)) {
        registrarErro(TipoEventoErro.ERRO_VALIDACAO_CAMPO, `cenario-b/validacao.${campo}`);
        return "Informe um valor numérico válido.";
      }
      if (numero < 0) {
        registrarErro(TipoEventoErro.ERRO_VALIDACAO_CAMPO, `cenario-b/validacao.${campo}`);
        return "Valor total não pode ser negativo.";
      }
    }
    return "";
  }

  function handleBlur(campo: keyof FormState) {
    const mensagem = validarCampo(campo, form[campo]);
    setErros((prev) => ({ ...prev, [campo]: mensagem }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const novosErros: Record<string, string> = {};
    (Object.keys(form) as (keyof FormState)[]).forEach((campo) => {
      const mensagem = validarCampo(campo, form[campo]);
      if (mensagem) novosErros[campo] = mensagem;
    });
    setErros(novosErros);
    if (Object.keys(novosErros).length) return;

    setEnviando(true);
    try {
      const response = await fetch("/api/notas-fiscais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: form.numero,
          fornecedor: form.fornecedor,
          dataEmissao: form.dataEmissao,
          valorTotal: Number(form.valorTotal.replace(",", ".")),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const mensagens: Record<string, string> = {};
        for (const erro of data.erros ?? []) {
          mensagens[erro.campo] = erro.mensagem;
          registrarErro(classificarTipoErroPorMensagem(erro.mensagem), `cenario-b/validacao.${erro.campo}`);
        }
        setErros(mensagens);
        return;
      }
      onConcluido(data);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[896px] overflow-hidden rounded-xl border border-[#c3c6d7] bg-white shadow-sm"
    >
      <div className="border-b border-[#c3c6d7] bg-[#f3f3fe] px-6 py-6">
        <h2 className="text-xl font-semibold text-[#191b23]">Validação da Nota Fiscal</h2>
      </div>

      <div className="grid grid-cols-2 gap-6 p-6">
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-1 text-sm font-medium text-[#191b23]">
            Número da NF
            <Info className="h-3.5 w-3.5 text-[#434655]" />
          </label>
          <input
            type="text"
            value={form.numero}
            onChange={(e) => setForm((prev) => ({ ...prev, numero: e.target.value }))}
            onBlur={() => handleBlur("numero")}
            className={`rounded-lg border px-4 py-2 text-sm text-[#191b23] focus:outline-none ${
              erros.numero ? "border-red-500" : "border-[#c3c6d7]"
            }`}
            placeholder="Ex: 4052"
          />
          {erros.numero && <p className="text-xs text-red-600">{erros.numero}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#191b23]">Fornecedor</label>
          <input
            type="text"
            value={form.fornecedor}
            onChange={(e) => setForm((prev) => ({ ...prev, fornecedor: e.target.value }))}
            onBlur={() => handleBlur("fornecedor")}
            className={`rounded-lg border px-4 py-2 text-sm text-[#191b23] focus:outline-none ${
              erros.fornecedor ? "border-red-500" : "border-[#c3c6d7]"
            }`}
            placeholder="Ex: TechSupplies Ind. Ltda."
          />
          {erros.fornecedor && <p className="text-xs text-red-600">{erros.fornecedor}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#191b23]">Data de Emissão</label>
          <input
            type="date"
            value={form.dataEmissao}
            onChange={(e) => setForm((prev) => ({ ...prev, dataEmissao: e.target.value }))}
            onBlur={() => handleBlur("dataEmissao")}
            className={`rounded-lg border px-4 py-2 text-sm text-[#191b23] focus:outline-none ${
              erros.dataEmissao ? "border-red-500" : "border-[#c3c6d7]"
            }`}
          />
          {erros.dataEmissao && <p className="text-xs text-red-600">{erros.dataEmissao}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#191b23]">Valor Total (R$)</label>
          <input
            type="text"
            value={form.valorTotal}
            onChange={(e) => setForm((prev) => ({ ...prev, valorTotal: e.target.value }))}
            onBlur={() => handleBlur("valorTotal")}
            className={`rounded-lg border px-4 py-2 text-sm text-[#191b23] focus:outline-none ${
              erros.valorTotal ? "border-red-500" : "border-[#c3c6d7]"
            }`}
            placeholder="Ex: 12450,00"
          />
          {erros.valorTotal && <p className="text-xs text-red-600">{erros.valorTotal}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-[#c3c6d7] bg-[#f3f3fe] px-4 py-4">
        <button type="button" className="rounded-lg px-5 py-2 text-sm font-medium text-[#434655]">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-[#004ac6] px-6 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50"
        >
          {enviando ? "Validando..." : "Próximo →"}
        </button>
      </div>
    </form>
  );
}
