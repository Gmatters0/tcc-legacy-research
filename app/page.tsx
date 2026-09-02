"use client";

import { useEffect, useState } from "react";
import { LoginForm } from "./components/LoginForm";
import { IniciarTarefaForm } from "./components/IniciarTarefaForm";
import type { UsuarioComHistorico } from "@/lib/business-logic/elegibilidade";

export default function Home() {
  // undefined = ainda checando /api/auth/me; null = deslogado; objeto = logado
  const [usuario, setUsuario] = useState<UsuarioComHistorico | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : null))
      .then(setUsuario)
      .catch(() => setUsuario(null));
  }, []);

  if (usuario === undefined) {
    return <div className="flex flex-1 bg-zinc-50" />;
  }

  if (!usuario) {
    return <LoginForm onLogin={setUsuario} />;
  }

  return <IniciarTarefaForm usuario={usuario} onLogout={() => setUsuario(null)} />;
}
