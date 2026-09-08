"use client";

import { useState, type FormEvent } from "react";
import { Info } from "lucide-react";
import { useSessao } from "@/lib/instrumentation/SessaoProvider";
import { classificarTipoErroPorMensagem } from "@/lib/instrumentation/erros";
import { fornecedorPareceNumeroNota } from "@/lib/instrumentation/heuristica";
import { TipoEventoErro } from "@/lib/instrumentation/types";
import type { FormValidacao, NotaFiscalResumo } from "../types";

// Digita só dígitos, formata como centavos (padrão de máscara monetária BR) —
// evita separador errado ou texto não numérico chegar no submit.
function aplicarMascaraMoeda(valorDigitado: string): string {
  const digitos = valorDigitado.replace(/\D/g, "");
  if (!digitos) return "";
  const numero = Number(digitos) / 100;
  return numero.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Desfaz a máscara (remove separador de milhar, troca vírgula decimal por
// ponto) antes de converter pra number.
function paraNumero(valorMascarado: string): number {
  return Number(valorMascarado.replace(/\./g, "").replace(",", "."));
}

interface Props {
  form: FormValidacao;
  onChangeForm: (form: FormValidacao) => void;
  notaFiscalExistente: NotaFiscalResumo | null;
  onConcluido: (notaFiscal: NotaFiscalResumo) => void;
}

export function PassoValidacao({ form, onChangeForm, notaFiscalExistente, onConcluido }: Props) {
  const { registrarErro } = useSessao();
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  // NF já foi criada (participante voltou ao Passo 1 e está revisando) — os
  // campos viram somente leitura e "Próximo" só navega, sem reenviar ao
  // servidor (evita tentar criar uma segunda NF com o mesmo número).
  const somenteLeitura = notaFiscalExistente !== null;

  function alterarCampo(campo: keyof FormValidacao, valor: string) {
    onChangeForm({ ...form, [campo]: valor });
  }

  function validarCampo(campo: keyof FormValidacao, valor: string) {
    if (!valor.trim()) {
      registrarErro(TipoEventoErro.INPUT_OBRIGATORIO_VAZIO, `cenario-b/validacao.${campo}`);
      return "Campo obrigatório.";
    }
    if (campo === "numero" && !/^\d+$/.test(valor.trim())) {
      registrarErro(TipoEventoErro.ERRO_VALIDACAO_CAMPO, `cenario-b/validacao.${campo}`);
      return "Número da NF deve conter apenas números.";
    }
    if (campo === "valorTotal") {
      const numero = paraNumero(valor);
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

  function handleBlur(campo: keyof FormValidacao) {
    if (somenteLeitura) return;
    const mensagem = validarCampo(campo, form[campo]);
    setErros((prev) => ({ ...prev, [campo]: mensagem }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (notaFiscalExistente) {
      onConcluido(notaFiscalExistente);
      return;
    }

    const novosErros: Record<string, string> = {};
    (Object.keys(form) as (keyof FormValidacao)[]).forEach((campo) => {
      const mensagem = validarCampo(campo, form[campo]);
      if (mensagem) novosErros[campo] = mensagem;
    });
    setErros(novosErros);
    if (Object.keys(novosErros).length) return;

    if (fornecedorPareceNumeroNota(form.fornecedor)) {
      registrarErro(TipoEventoErro.ERRO_LOGICO_CADASTRO, `fornecedor="${form.fornecedor}"`);
    }

    setEnviando(true);
    try {
      const response = await fetch("/api/notas-fiscais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: form.numero,
          fornecedor: form.fornecedor,
          dataEmissao: form.dataEmissao,
          valorTotal: paraNumero(form.valorTotal),
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
        {somenteLeitura && (
          <p className="mt-1 text-xs text-[#434655]">
            Esta nota fiscal já foi registrada — os campos abaixo são só para conferência.
          </p>
        )}
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
            onChange={(e) => alterarCampo("numero", e.target.value)}
            onBlur={() => handleBlur("numero")}
            readOnly={somenteLeitura}
            className={`rounded-lg border px-4 py-2 text-sm text-[#191b23] focus:outline-none ${
              somenteLeitura ? "bg-[#f3f4f6]" : ""
            } ${erros.numero ? "border-red-500" : "border-[#c3c6d7]"}`}
            placeholder="Ex: 4052"
          />
          {erros.numero && <p className="text-xs text-red-600">{erros.numero}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#191b23]">Fornecedor</label>
          <input
            type="text"
            value={form.fornecedor}
            onChange={(e) => alterarCampo("fornecedor", e.target.value)}
            onBlur={() => handleBlur("fornecedor")}
            readOnly={somenteLeitura}
            className={`rounded-lg border px-4 py-2 text-sm text-[#191b23] focus:outline-none ${
              somenteLeitura ? "bg-[#f3f4f6]" : ""
            } ${erros.fornecedor ? "border-red-500" : "border-[#c3c6d7]"}`}
            placeholder="Ex: TechSupplies Ind. Ltda."
          />
          {erros.fornecedor && <p className="text-xs text-red-600">{erros.fornecedor}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#191b23]">Data de Emissão</label>
          <input
            type="date"
            value={form.dataEmissao}
            onChange={(e) => alterarCampo("dataEmissao", e.target.value)}
            onBlur={() => handleBlur("dataEmissao")}
            readOnly={somenteLeitura}
            className={`rounded-lg border px-4 py-2 text-sm text-[#191b23] focus:outline-none ${
              somenteLeitura ? "bg-[#f3f4f6]" : ""
            } ${erros.dataEmissao ? "border-red-500" : "border-[#c3c6d7]"}`}
          />
          {erros.dataEmissao && <p className="text-xs text-red-600">{erros.dataEmissao}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#191b23]">Valor Total (R$)</label>
          <input
            type="text"
            inputMode="numeric"
            value={form.valorTotal}
            onChange={(e) => alterarCampo("valorTotal", aplicarMascaraMoeda(e.target.value))}
            onBlur={() => handleBlur("valorTotal")}
            readOnly={somenteLeitura}
            className={`rounded-lg border px-4 py-2 text-sm text-[#191b23] focus:outline-none ${
              somenteLeitura ? "bg-[#f3f4f6]" : ""
            } ${erros.valorTotal ? "border-red-500" : "border-[#c3c6d7]"}`}
            placeholder="Ex: 12.450,00"
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
          className="rounded-lg bg-[#004ac6] px-6 py-2 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? "Validando..." : "Próximo →"}
        </button>
      </div>
    </form>
  );
}
