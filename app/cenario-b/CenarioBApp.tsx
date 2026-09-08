"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SessaoProvider, useSessao } from "@/lib/instrumentation/SessaoProvider";
import { TipoEventoErro } from "@/lib/instrumentation/types";
import { TopAppBar } from "./components/TopAppBar";
import { SideNavBar } from "./components/SideNavBar";
import { Stepper } from "./components/Stepper";
import { PassoValidacao } from "./components/PassoValidacao";
import { PassoConferencia } from "./components/PassoConferencia";
import { PassoBaixa } from "./components/PassoBaixa";
import type { FormBaixa, FormValidacao, ItemConferencia, NotaFiscalResumo } from "./types";

const FORM_VALIDACAO_INICIAL: FormValidacao = { numero: "", fornecedor: "", dataEmissao: "", valorTotal: "" };
const FORM_BAIXA_INICIAL: FormBaixa = { armazem: "", lote: "", quantidade: "" };

function CenarioBConteudo() {
  const { registrarErro } = useSessao();
  const router = useRouter();

  const [passoAtual, setPassoAtual] = useState(1);
  const [notaFiscal, setNotaFiscal] = useState<NotaFiscalResumo | null>(null);
  const [conferenciaConcluida, setConferenciaConcluida] = useState(false);
  const [quantidadeConferida, setQuantidadeConferida] = useState(0);

  // Estado dos três passos elevado até aqui (ver comentário em types.ts) — cada
  // Passo é renderizado condicionalmente e desmontaria ao navegar para outro,
  // então precisa viver num componente que nunca desmonta durante o fluxo.
  const [formValidacao, setFormValidacao] = useState<FormValidacao>(FORM_VALIDACAO_INICIAL);
  const [itensConferencia, setItensConferencia] = useState<ItemConferencia[]>([]);
  const [formBaixa, setFormBaixa] = useState<FormBaixa>(FORM_BAIXA_INICIAL);

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
    <div className="min-h-screen bg-white pl-[260px] [&_button:not(:disabled)]:cursor-pointer">
      <SideNavBar />
      <div className="flex min-h-screen flex-col">
        <TopAppBar />
        <main className="flex flex-1 flex-col items-center gap-6 bg-[#faf8ff] p-8">
          <div className="flex w-full max-w-[956px] flex-col gap-2">
            <p className="text-xs text-[#434655]">Fiscal &gt; Entrada de Nota Fiscal</p>
            <h1 className="text-2xl font-semibold text-[#191b23]">Entrada de Nota Fiscal</h1>
            <p className="text-sm text-[#434655]">Recebimento, conferência e baixa em estoque da nota fiscal.</p>
          </div>

          <Stepper passoAtual={passoAtual} onNavegar={handleNavegarPasso} />

          {passoAtual === 1 && (
            <PassoValidacao
              form={formValidacao}
              onChangeForm={setFormValidacao}
              notaFiscalExistente={notaFiscal}
              onConcluido={(nota) => {
                setNotaFiscal(nota);
                setPassoAtual(2);
              }}
            />
          )}
          {passoAtual === 2 && notaFiscal && (
            <PassoConferencia
              notaFiscalId={notaFiscal.id}
              itens={itensConferencia}
              onChangeItens={setItensConferencia}
              onVoltar={() => setPassoAtual(1)}
              onConcluido={(quantidadeTotal) => {
                setQuantidadeConferida(quantidadeTotal);
                setConferenciaConcluida(true);
                // Só sugere a quantidade da conferência na primeira chegada ao
                // passo 3 — se o participante já tinha editado e voltou, o que
                // ele digitou não é sobrescrito.
                setFormBaixa((prev) => (prev.quantidade === "" ? { ...prev, quantidade: String(quantidadeTotal) } : prev));
                setPassoAtual(3);
              }}
            />
          )}
          {passoAtual === 3 && notaFiscal && (
            <PassoBaixa
              notaFiscal={notaFiscal}
              quantidadeSugerida={quantidadeConferida}
              form={formBaixa}
              onChangeForm={setFormBaixa}
              onVoltar={() => setPassoAtual(2)}
              onConcluido={() => router.push("/sucesso")}
            />
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
