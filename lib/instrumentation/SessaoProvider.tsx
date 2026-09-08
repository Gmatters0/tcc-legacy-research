"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { finalizarSessao } from "./session";
import { registrarErro } from "./erros";
import { Cenario, TipoEventoErro } from "./types";

interface SessaoContextValue {
  sessaoId: string | null;
  cenario: Cenario;
  registrarErro: (tipo: TipoEventoErro, detalhe?: string) => void;
  finalizarSessao: () => Promise<void>;
}

const SessaoContext = createContext<SessaoContextValue | null>(null);

export function SessaoProvider({
  sessaoId,
  cenario,
  children,
}: {
  sessaoId: string | null;
  cenario: Cenario;
  children: ReactNode;
}) {
  const finalizada = useRef(false);
  const router = useRouter();

  const registrar = useCallback(
    (tipo: TipoEventoErro, detalhe?: string) => {
      if (!sessaoId) return;
      void registrarErro({ sessaoId, tipo, detalhe });
    },
    [sessaoId],
  );

  const finalizar = useCallback(async () => {
    if (!sessaoId || finalizada.current) return;
    finalizada.current = true;
    await finalizarSessao(sessaoId);
  }, [sessaoId]);

  useEffect(() => {
    if (!sessaoId) return;

    function handlePageHide() {
      if (finalizada.current || !sessaoId) return;
      // Caminho de "escape": participante fecha a aba, navega para fora ou
      // recarrega a página antes de terminar a tarefa. sendBeacon é o único
      // mecanismo confiável de disparar uma requisição nesse momento.
      navigator.sendBeacon(`/api/sessoes/${sessaoId}/abandonar`);
    }

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [sessaoId]);

  useEffect(() => {
    if (!sessaoId) return;

    // Aviso nativo do navegador (texto genérico, não customizável) antes de
    // recarregar/fechar durante uma sessão ativa. Não persiste dados — se o
    // participante confirmar mesmo assim, o formulário volta em branco, como
    // hoje. Navegação client-side (router.push, ex: para /sucesso) não passa
    // por aqui — só reload/fechar aba/navegar para fora disparam beforeunload.
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (finalizada.current) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sessaoId]);

  useEffect(() => {
    if (!sessaoId) return;

    // beforeunload não dispara em navegação client-side do App Router — o
    // botão Voltar do navegador entre /cenario-a|b e / usa popstate, não
    // unload de página. Empilha uma entrada extra de histórico como "trava":
    // ao voltar, intercepta e confirma antes de deixar sair de verdade. Se
    // confirmado, navega direto pra home em vez de tentar "repetir" o back
    // nativo — chamadas sucessivas a history.back() no mesmo turno podem ser
    // descartadas pelo navegador, e a única saída real de /cenario-a|b
    // sempre foi a home mesmo.
    window.history.pushState(null, "", window.location.href);

    function handlePopState() {
      if (finalizada.current) return;
      const confirmarSaida = window.confirm(
        "Você tem uma tarefa em andamento. Se sair agora, o progresso não será salvo. Deseja realmente sair?",
      );
      if (confirmarSaida) {
        router.push("/");
      } else {
        window.history.pushState(null, "", window.location.href);
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [sessaoId, router]);

  const value = useMemo(
    () => ({ sessaoId, cenario, registrarErro: registrar, finalizarSessao: finalizar }),
    [sessaoId, cenario, registrar, finalizar],
  );

  return <SessaoContext.Provider value={value}>{children}</SessaoContext.Provider>;
}

export function useSessao() {
  const context = useContext(SessaoContext);
  if (!context) {
    throw new Error("useSessao deve ser usado dentro de um SessaoProvider.");
  }
  return context;
}
