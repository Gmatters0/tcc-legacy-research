import { prisma } from "@/lib/prisma";
import { BusinessLogicError, ErroCampo } from "./types";
import type { UsuarioPublico } from "@/lib/auth/types";

// Regra de não-repetição: cada Usuario pode concluir o teste no máximo uma vez
// por cenário e uma vez por conjunto de tarefa — usada tanto para pré-selecionar
// e bloquear opções já usadas na home quanto para rejeitar no servidor uma
// tentativa de repetir (nunca confiar só na trava do client).
export interface HistoricoParticipacao {
  cenariosConcluidos: string[];
  conjuntosTarefaConcluidos: string[];
}

// perfilUsuario é o perfil informado na sessão concluída mais recente (null se
// ainda não concluiu nenhuma) — o perfil é da pessoa, não do cenário, então a
// home o pré-seleciona e trava no segundo cenário, igual cenário/conjunto.
export interface HistoricoComPerfil extends HistoricoParticipacao {
  perfilUsuario: string | null;
}

export interface UsuarioComHistorico extends UsuarioPublico, HistoricoComPerfil {}

export async function buscarHistoricoParticipacao(usuarioId: string): Promise<HistoricoComPerfil> {
  const sessoes = await prisma.sessaoTeste.findMany({
    where: { usuarioId, timestampFim: { not: null } },
    select: { cenario: true, conjuntoTarefa: true, perfilUsuario: true },
    orderBy: { timestampInicio: "desc" },
  });

  return {
    cenariosConcluidos: [...new Set(sessoes.map((s) => s.cenario))],
    conjuntosTarefaConcluidos: [...new Set(sessoes.map((s) => s.conjuntoTarefa))],
    perfilUsuario: sessoes[0]?.perfilUsuario ?? null,
  };
}

export function validarElegibilidade(
  cenario: string,
  conjuntoTarefa: string,
  historico: HistoricoParticipacao,
): void {
  const erros: ErroCampo[] = [];
  if (historico.cenariosConcluidos.includes(cenario)) {
    erros.push({ campo: "cenario", mensagem: "Você já concluiu o teste neste cenário." });
  }
  if (historico.conjuntosTarefaConcluidos.includes(conjuntoTarefa)) {
    erros.push({ campo: "conjuntoTarefa", mensagem: "Você já concluiu o teste com este conjunto de tarefa." });
  }
  if (erros.length) throw new BusinessLogicError(erros);
}
