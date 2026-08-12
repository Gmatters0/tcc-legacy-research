import { PerfilUsuario, SessaoTeste } from "./types";

export interface CriarSessaoInput {
  participanteId: string;
  perfilUsuario: PerfilUsuario;
  cenario: string;
  conjuntoTarefa: string;
}

export async function criarSessao(input: CriarSessaoInput): Promise<SessaoTeste> {
  const response = await fetch("/api/sessoes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("Não foi possível iniciar a sessão de teste.");
  }
  return response.json();
}

export async function finalizarSessao(sessaoId: string): Promise<SessaoTeste> {
  const response = await fetch(`/api/sessoes/${sessaoId}`, { method: "PATCH" });
  if (!response.ok) {
    throw new Error("Não foi possível finalizar a sessão de teste.");
  }
  return response.json();
}
