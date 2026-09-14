import { prisma } from "@/lib/prisma";
import { BusinessLogicError, ErroCampo } from "./types";

export interface ComparacaoFinalInput {
  preferencia: string;
  porque: string;
  feedback?: string;
}

function validarComparacaoFinalInput(input: ComparacaoFinalInput) {
  const erros: ErroCampo[] = [];

  if (input.preferencia !== "A" && input.preferencia !== "B") {
    erros.push({ campo: "preferencia", mensagem: "Selecione qual cenário você preferiu." });
  }
  if (!input.porque?.trim()) {
    erros.push({ campo: "porque", mensagem: "Explique o motivo da sua preferência." });
  }

  if (erros.length) throw new BusinessLogicError(erros);
}

export async function registrarComparacaoFinal(usuarioId: string, input: ComparacaoFinalInput) {
  validarComparacaoFinalInput(input);

  try {
    return await prisma.comparacaoFinal.create({
      data: {
        usuarioId,
        preferencia: input.preferencia,
        porque: input.porque.trim(),
        feedback: input.feedback?.trim() || null,
      },
    });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      throw new BusinessLogicError([{ campo: "usuarioId", mensagem: "A comparação final já foi registrada." }]);
    }
    throw err;
  }
}
