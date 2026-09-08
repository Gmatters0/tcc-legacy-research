"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SessaoProvider, useSessao } from "@/lib/instrumentation/SessaoProvider";
import { classificarTipoErroPorMensagem } from "@/lib/instrumentation/erros";
import { TipoEventoErro } from "@/lib/instrumentation/types";
import { pareceCampoTrocado } from "@/lib/instrumentation/heuristica";
import { TopNavBar } from "./components/TopNavBar";
import { FooterFKeys } from "./components/FooterFKeys";
import { FieldsetValidacao } from "./components/FieldsetValidacao";
import { FieldsetConferencia } from "./components/FieldsetConferencia";
import { FieldsetBaixa } from "./components/FieldsetBaixa";
import { ErrorReviewModal } from "./components/ErrorReviewModal";
import { DepositoModal } from "./components/DepositoModal";
import type { ErroApi, ItemConferenciaA } from "./types";

function paraIso(dataPontuada: string): string {
  const partes = dataPontuada.split(".").map((parte) => parte.trim());
  if (partes.length !== 3) return dataPontuada;
  const [dia, mes, ano] = partes;
  return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}

// Converte texto de quantidade em número, preservando a distinção entre
// "vazio" (undefined, vira INPUT_OBRIGATORIO_VAZIO na API) e "0" (número
// válido, vira ERRO_VALIDACAO_CAMPO quando a regra exige > 0).
function paraQuantidade(texto: string): number | undefined {
  return texto.trim() === "" ? undefined : Number(texto);
}

const ITEM_VAZIO: ItemConferenciaA = {
  codigo: "",
  descricao: "",
  qtdPedidaTexto: "",
  qtdRecebidaTexto: "",
  unidade: "",
};

function CenarioAConteudo() {
  const { registrarErro, finalizarSessao } = useSessao();
  const router = useRouter();

  const [numero, setNumero] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [dataEmissao, setDataEmissao] = useState("");
  const [valorTotal, setValorTotal] = useState("");

  const [itens, setItens] = useState<ItemConferenciaA[]>([]);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());

  const [armazem, setArmazem] = useState("");
  const [lote, setLote] = useState("");
  const [status, setStatus] = useState<"Pendente" | "Concluído">("Pendente");
  const [modalDepositoAberto, setModalDepositoAberto] = useState(false);

  const [erros, setErros] = useState<ErroApi[] | null>(null);
  const [salvando, setSalvando] = useState(false);
  // Guarda síncrono contra duplo clique/duplo F2 — não depende do re-render.
  const salvandoRef = useRef(false);

  const quantidadeLancar = itens.reduce((soma, item) => soma + (Number(item.qtdRecebidaTexto) || 0), 0);

  function handleAlterarCampoValidacao(
    campo: "numero" | "fornecedor" | "dataEmissao" | "valorTotal",
    valor: string,
  ) {
    if (campo === "numero") setNumero(valor);
    if (campo === "fornecedor") setFornecedor(valor);
    if (campo === "dataEmissao") setDataEmissao(valor);
    if (campo === "valorTotal") setValorTotal(valor);
  }

  function handleNovoItem() {
    setItens((prev) => [...prev, { ...ITEM_VAZIO }]);
  }

  function handleAlterarItem(index: number, campo: keyof ItemConferenciaA, valor: string) {
    setItens((prev) => prev.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)));
  }

  function handleAlternarSelecao(index: number) {
    setSelecionados((prev) => {
      const proximo = new Set(prev);
      if (proximo.has(index)) proximo.delete(index);
      else proximo.add(index);
      return proximo;
    });
  }

  function handleExcluirSelecionados() {
    if (selecionados.size === 0) {
      registrarErro(TipoEventoErro.CLIQUE_FORA_FLUXO, "elemento: conferencia.Excluir-sem-selecao");
      return;
    }
    setItens((prev) => prev.filter((_, index) => !selecionados.has(index)));
    setSelecionados(new Set());
  }

  function handlePesquisarDecorativo() {
    registrarErro(TipoEventoErro.CLIQUE_FORA_FLUXO, "elemento: conferencia.Pesquisar");
  }

  function handleSelecionarDeposito(codigo: string) {
    setArmazem(codigo);
    setModalDepositoAberto(false);
  }

  async function handleSalvar() {
    if (salvandoRef.current) return;
    salvandoRef.current = true;
    setSalvando(true);
    setErros(null);
    const errosColetados: ErroApi[] = [];

    try {
      if (pareceCampoTrocado(armazem, lote)) {
        registrarErro(TipoEventoErro.ERRO_LOGICO_CADASTRO, `armazem="${armazem}" lote="${lote}"`);
      }

      const respostaNota = await fetch("/api/notas-fiscais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero,
          fornecedor,
          dataEmissao: paraIso(dataEmissao),
          valorTotal: paraQuantidade(valorTotal.replace(",", ".")),
        }),
      });
      const dadosNota = await respostaNota.json();
      if (!respostaNota.ok) {
        errosColetados.push(...(dadosNota.erros ?? []));
        return;
      }

      const respostaItens = await fetch(`/api/notas-fiscais/${dadosNota.id}/itens`, {
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
      const dadosItens = await respostaItens.json();
      if (!respostaItens.ok) {
        errosColetados.push(...(dadosItens.erros ?? []));
        return;
      }

      const respostaBaixa = await fetch(`/api/notas-fiscais/${dadosNota.id}/baixa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ armazem, lote, quantidade: quantidadeLancar }),
      });
      const dadosBaixa = await respostaBaixa.json();
      if (!respostaBaixa.ok) {
        errosColetados.push(...(dadosBaixa.erros ?? []));
        return;
      }

      setStatus("Concluído");
      await finalizarSessao();
      router.push("/sucesso");
    } catch {
      errosColetados.push({ campo: "geral", mensagem: "Falha de comunicação com o servidor." });
    } finally {
      salvandoRef.current = false;
      setSalvando(false);
      if (errosColetados.length) {
        errosColetados.forEach((erro) => registrarErro(classificarTipoErroPorMensagem(erro.mensagem), erro.campo));
        setErros(errosColetados);
      }
    }
  }

  // F2 já aparece descrito no rodapé ([F2] Salvar) — ativa o atalho de
  // verdade, fidelidade ao padrão de teclas de função do legado (SAP/Protheus).
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "F2") return;
      event.preventDefault();
      handleSalvar();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#dbdad9] text-[#1b1c1c]">
      <TopNavBar onSalvar={handleSalvar} />
      <main className="flex flex-1 flex-col gap-2 overflow-auto bg-[#d2d2d2] p-1">
        <div className="border-b border-[#9ca3af] px-2 pb-1.5 pt-1">
          <h1 className="text-base font-bold">Entrada de Nota Fiscal</h1>
        </div>
        <div className="flex flex-col gap-2 p-1">
          <FieldsetValidacao
            numero={numero}
            fornecedor={fornecedor}
            dataEmissao={dataEmissao}
            valorTotal={valorTotal}
            onChange={handleAlterarCampoValidacao}
          />
          <FieldsetConferencia
            itens={itens}
            selecionados={selecionados}
            onAlterarItem={handleAlterarItem}
            onAlternarSelecao={handleAlternarSelecao}
            onNovoItem={handleNovoItem}
            onExcluirSelecionados={handleExcluirSelecionados}
            onPesquisarDecorativo={handlePesquisarDecorativo}
          />
          <FieldsetBaixa
            armazem={armazem}
            lote={lote}
            quantidade={quantidadeLancar}
            status={status}
            onChangeArmazem={setArmazem}
            onChangeLote={setLote}
            onAbrirModalDeposito={() => setModalDepositoAberto(true)}
          />
        </div>
      </main>
      <FooterFKeys onSalvar={handleSalvar} />
      {modalDepositoAberto && (
        <DepositoModal onSelecionar={handleSelecionarDeposito} onFechar={() => setModalDepositoAberto(false)} />
      )}
      {erros && erros.length > 0 && <ErrorReviewModal erros={erros} onFechar={() => setErros(null)} />}
      {salvando && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
          <div className="border border-[#727780] bg-white px-6 py-3 text-sm text-[#1b1c1c]">Salvando...</div>
        </div>
      )}
    </div>
  );
}

export function CenarioAApp() {
  const searchParams = useSearchParams();
  const sessaoId = searchParams.get("sessaoId");

  return (
    <SessaoProvider sessaoId={sessaoId} cenario="A">
      <CenarioAConteudo />
    </SessaoProvider>
  );
}
