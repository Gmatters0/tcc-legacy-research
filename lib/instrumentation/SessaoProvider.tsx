"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
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
