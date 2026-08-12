"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { SessaoProvider, useSessao } from "@/lib/instrumentation/SessaoProvider";
import { TipoEventoErro } from "@/lib/instrumentation/types";
import { TopAppBar } from "./components/TopAppBar";
import { SideNavBar } from "./components/SideNavBar";
import { Stepper } from "./components/Stepper";
import { PassoValidacao } from "./components/PassoValidacao";
import { PassoConferencia } from "./components/PassoConferencia";
import { PassoBaixa } from "./components/PassoBaixa";
import type { NotaFiscalResumo } from "./types";

function CenarioBConteudo() {
  const { registrarErro } = useSessao();

  const [passoAtual, setPassoAtual] = useState(1);
  const [notaFiscal, setNotaFiscal] = useState<NotaFiscalResumo | null>(null);
  const [conferenciaConcluida, setConferenciaConcluida] = useState(false);
  const [quantidadeConferida, setQuantidadeConferida] = useState(0);
  const [concluido, setConcluido] = useState(false);

  // Passo 2 só é alcançável depois que a NF existe (passo 1 concluído); passo
  // 3 só depois que a conferência foi confirmada (passo 2 concluído) — um
  // depende do outro. Navegar de volta a qualquer passo já alcançado é livre.
  const maiorPassoAlcancado = conferenciaConcluida ? 3 : notaFiscal ? 2 : 1;

  function handleNavegarPasso(passoAlvo: number) {
    if (passoAlvo === passoAtual) return;
    if (passoAlvo > maiorPassoAlcancado) {
      registrarErro(
        TipoEventoErro.CLIQUE_FORA_FLUXO,
        `elemento: stepper.passo-${passoAlvo} — tentativa a partir do passo ${passoAtual}, maior passo alcançado: ${maiorPassoAlcancado}`,
      );
      return;
    }
    setPassoAtual(passoAlvo);
  }

  return (
    <div className="min-h-screen bg-white pl-[260px]">
      <SideNavBar />
      <div className="flex min-h-screen flex-col">
        <TopAppBar />
        <main className="flex flex-1 flex-col items-center gap-6 bg-[#faf8ff] p-8">
          <div className="flex w-full max-w-[956px] flex-col gap-2">
            <p className="text-xs text-[#434655]">Fiscal &gt; Entrada de Nota Fiscal</p>
            <h1 className="text-2xl font-semibold text-[#191b23]">Entrada de Nota Fiscal</h1>
            <p className="text-sm text-[#434655]">Recebimento, conferência e baixa em estoque da nota fiscal.</p>
          </div>

          {!concluido && <Stepper passoAtual={passoAtual} onNavegar={handleNavegarPasso} />}

          {concluido && notaFiscal ? (
            <div className="flex w-full max-w-[672px] flex-col items-center gap-3 rounded-xl border border-[#c3c6d7] bg-white p-10 text-center shadow-sm">
              <CheckCircle2 className="h-10 w-10 text-[#16a34a]" />
              <h2 className="text-lg font-semibold text-[#191b23]">Entrada de mercadoria concluída</h2>
              <p className="text-sm text-[#434655]">
                A NF #{notaFiscal.numero} foi conferida e a baixa em estoque foi registrada com sucesso.
              </p>
            </div>
          ) : (
            <>
              {passoAtual === 1 && (
                <PassoValidacao
                  onConcluido={(nota) => {
                    setNotaFiscal(nota);
                    setPassoAtual(2);
                  }}
                />
              )}
              {passoAtual === 2 && notaFiscal && (
                <PassoConferencia
                  notaFiscalId={notaFiscal.id}
                  onVoltar={() => setPassoAtual(1)}
                  onConcluido={(quantidadeTotal) => {
                    setQuantidadeConferida(quantidadeTotal);
                    setConferenciaConcluida(true);
                    setPassoAtual(3);
                  }}
                />
              )}
              {passoAtual === 3 && notaFiscal && (
                <PassoBaixa
                  notaFiscal={notaFiscal}
                  quantidadeSugerida={quantidadeConferida}
                  onVoltar={() => setPassoAtual(2)}
                  onConcluido={() => setConcluido(true)}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export function CenarioBApp() {
  const searchParams = useSearchParams();
  const sessaoId = searchParams.get("sessaoId");

  return (
    <SessaoProvider sessaoId={sessaoId} cenario="B">
      <CenarioBConteudo />
    </SessaoProvider>
  );
}
