"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { PassoTlx } from "./components/PassoTlx";
import { PassoLikert } from "./components/PassoLikert";
import { PassoComparacaoFinal } from "./components/PassoComparacaoFinal";
import { SUS_ITENS, SUBJETIVO_ITENS, TLX_ITENS, TlxChave } from "@/lib/avaliacao-config";

type Tela = "tlx" | "sus" | "subjetivo" | "verificando" | "comparacao" | "finalizando";

const TLX_INICIAL: Record<TlxChave, number> = {
  mental: 50,
  fisica: 50,
  temporal: 50,
  desempenho: 50,
  esforco: 50,
  frustracao: 50,
};

const TLX_TOCADO_INICIAL: Record<TlxChave, boolean> = {
  mental: false,
  fisica: false,
  temporal: false,
  desempenho: false,
  esforco: false,
  frustracao: false,
};

export function SucessoApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessaoId = searchParams.get("sessaoId");

  const [tela, setTela] = useState<Tela>("tlx");
  const [tlx, setTlx] = useState(TLX_INICIAL);
  const [tlxTocado, setTlxTocado] = useState(TLX_TOCADO_INICIAL);
  const [sus, setSus] = useState<(number | undefined)[]>(new Array(SUS_ITENS.length).fill(undefined));
  const [subjetivo, setSubjetivo] = useState<(number | undefined)[]>(new Array(SUBJETIVO_ITENS.length).fill(undefined));
  const [comparacaoPreferencia, setComparacaoPreferencia] = useState<"A" | "B" | "">("");
  const [comparacaoPorque, setComparacaoPorque] = useState("");
  const [comparacaoFeedback, setComparacaoFeedback] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [faltando, setFaltando] = useState<Set<number>>(new Set());
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!sessaoId) router.replace("/");
  }, [sessaoId, router]);

  function handleAvancarTlx() {
    const semTocar = TLX_ITENS.filter((item) => !tlxTocado[item.chave]);
    if (semTocar.length) {
      setErro(`Ajuste todos os controles antes de continuar — ${semTocar.length} item(ns) ainda não foram tocados.`);
      return;
    }
    setErro(null);
    setTela("sus");
  }

  function validarLikert(respostas: (number | undefined)[]): Set<number> {
    const faltam = new Set<number>();
    respostas.forEach((valor, indice) => {
      if (valor === undefined) faltam.add(indice);
    });
    return faltam;
  }

  function handleAvancarSus() {
    const faltam = validarLikert(sus);
    if (faltam.size) {
      setFaltando(faltam);
      setErro("Responda todas as afirmações antes de continuar.");
      return;
    }
    setErro(null);
    setFaltando(new Set());
    setTela("subjetivo");
  }

  async function handleEnviarAvaliacao() {
    const faltam = validarLikert(subjetivo);
    if (faltam.size) {
      setFaltando(faltam);
      setErro("Responda todas as afirmações antes de enviar.");
      return;
    }

    setErro(null);
    setEnviando(true);
    setTela("verificando");

    try {
      const respostaAvaliacao = await fetch(`/api/sessoes/${sessaoId}/avaliacao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tlx, sus, subjetivo }),
      });
      if (!respostaAvaliacao.ok) {
        const dados = await respostaAvaliacao.json().catch(() => null);
        throw new Error(dados?.erros?.[0]?.mensagem ?? "Não foi possível registrar a avaliação.");
      }

      const respostaMe = await fetch("/api/auth/me");
      if (!respostaMe.ok) throw new Error("Não foi possível verificar sua participação.");
      const dadosUsuario = await respostaMe.json();

      const aindaTemCenario = dadosUsuario.cenariosConcluidos.length < 2;
      const aindaTemConjunto = dadosUsuario.conjuntosTarefaConcluidos.length < 2;

      if (aindaTemCenario && aindaTemConjunto) {
        router.push("/");
        return;
      }

      setTela("comparacao");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível registrar a avaliação. Tente novamente.");
      setTela("subjetivo");
    } finally {
      setEnviando(false);
    }
  }

  async function handleEnviarComparacao() {
    if (!comparacaoPreferencia) {
      setErro("Selecione qual interface você preferiu.");
      return;
    }
    if (!comparacaoPorque.trim()) {
      setErro("Explique o motivo da sua preferência.");
      return;
    }

    setErro(null);
    setEnviando(true);

    try {
      const respostaComparacao = await fetch("/api/auth/comparacao-final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferencia: comparacaoPreferencia,
          porque: comparacaoPorque,
          feedback: comparacaoFeedback,
        }),
      });
      if (!respostaComparacao.ok) {
        const dados = await respostaComparacao.json().catch(() => null);
        throw new Error(dados?.erros?.[0]?.mensagem ?? "Não foi possível registrar a comparação.");
      }

      setTela("finalizando");
      const respostaFinalizar = await fetch("/api/auth/finalizar-participacao", { method: "POST" });
      if (!respostaFinalizar.ok) throw new Error("Não foi possível finalizar a participação.");

      router.push("/obrigado");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível concluir. Tente novamente.");
      setTela("comparacao");
    } finally {
      setEnviando(false);
    }
  }

  if (!sessaoId) return null;

  if (tela === "verificando" || tela === "finalizando") {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
        <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          <p className="text-sm text-zinc-600">{tela === "finalizando" ? "Finalizando participação…" : "Enviando…"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      {tela === "tlx" && (
        <PassoTlx
          valores={tlx}
          tocado={tlxTocado}
          onChange={(chave, valor) => {
            setTlx((prev) => ({ ...prev, [chave]: valor }));
            setTlxTocado((prev) => ({ ...prev, [chave]: true }));
          }}
          onAvancar={handleAvancarTlx}
          erro={erro}
        />
      )}
      {tela === "sus" && (
        <PassoLikert
          passo="Passo 2 de 3"
          titulo="Usabilidade do Sistema — SUS"
          instrucao="Indique o quanto você concorda ou discorda de cada afirmação sobre o sistema que acabou de usar."
          itens={SUS_ITENS}
          respostas={sus}
          onChange={(indice, valor) => {
            setSus((prev) => prev.map((v, i) => (i === indice ? valor : v)));
            setFaltando((prev) => {
              const proximo = new Set(prev);
              proximo.delete(indice);
              return proximo;
            });
          }}
          onAvancar={handleAvancarSus}
          onVoltar={() => setTela("tlx")}
          erro={erro}
          faltando={faltando}
        />
      )}
      {tela === "subjetivo" && (
        <PassoLikert
          passo="Passo 3 de 3"
          titulo="Percepção Geral"
          instrucao="Últimas afirmações, também sobre o sistema que acabou de usar."
          itens={SUBJETIVO_ITENS}
          respostas={subjetivo}
          onChange={(indice, valor) => {
            setSubjetivo((prev) => prev.map((v, i) => (i === indice ? valor : v)));
            setFaltando((prev) => {
              const proximo = new Set(prev);
              proximo.delete(indice);
              return proximo;
            });
          }}
          onAvancar={handleEnviarAvaliacao}
          onVoltar={() => setTela("sus")}
          textoAvancar={enviando ? "Enviando…" : "Enviar avaliação"}
          erro={erro}
          faltando={faltando}
        />
      )}
      {tela === "comparacao" && (
        <PassoComparacaoFinal
          preferencia={comparacaoPreferencia}
          porque={comparacaoPorque}
          feedback={comparacaoFeedback}
          onChangePreferencia={setComparacaoPreferencia}
          onChangePorque={setComparacaoPorque}
          onChangeFeedback={setComparacaoFeedback}
          onEnviar={handleEnviarComparacao}
          enviando={enviando}
          erro={erro}
        />
      )}
    </div>
  );
}
