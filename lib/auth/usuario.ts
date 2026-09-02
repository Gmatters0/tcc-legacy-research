import { prisma } from "@/lib/prisma";
import { BusinessLogicError, ErroCampo } from "@/lib/business-logic/types";
import { gerarSenhaAleatoria, hashSenha, verificarSenha } from "./password";
import { UsuarioPublico } from "./types";

export async function autenticarUsuario(codigo: string, senha: string): Promise<UsuarioPublico> {
  const erros: ErroCampo[] = [];
  if (!codigo?.trim()) erros.push({ campo: "codigo", mensagem: "Código do participante é obrigatório." });
  if (!senha) erros.push({ campo: "senha", mensagem: "Senha é obrigatória." });
  if (erros.length) throw new BusinessLogicError(erros);

  const usuario = await prisma.usuario.findUnique({ where: { codigo: codigo.trim() } });
  if (!usuario || !usuario.ativo || !verificarSenha(senha, usuario.senhaHash)) {
    throw new BusinessLogicError([{ campo: "geral", mensagem: "Código ou senha inválidos." }]);
  }

  return { id: usuario.id, codigo: usuario.codigo };
}

export async function buscarUsuarioAtivoPorId(id: string): Promise<UsuarioPublico | null> {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario || !usuario.ativo) return null;
  return { id: usuario.id, codigo: usuario.codigo };
}

// Reutilizadas pelo painel administrativo (Sprint 3) e pela desativação
// automática ao final da participação (Sprint 2) — a lógica de negócio fica
// centralizada aqui desde já, mesmo sem UI própria ainda nesta sprint.
export async function desativarUsuario(id: string): Promise<void> {
  await prisma.usuario.update({ where: { id }, data: { ativo: false } });
}

export async function reativarUsuario(id: string): Promise<void> {
  await prisma.usuario.update({ where: { id }, data: { ativo: true } });
}

export async function listarUsuarios(): Promise<(UsuarioPublico & { ativo: boolean; createdAt: Date })[]> {
  const usuarios = await prisma.usuario.findMany({ orderBy: { createdAt: "desc" } });
  return usuarios.map((u) => ({ id: u.id, codigo: u.codigo, ativo: u.ativo, createdAt: u.createdAt }));
}

// Código no padrão P[Iniciais]-[Sequencial] (ex: "PJS-01") — o sequencial
// desambigua participantes com as mesmas iniciais, reiniciando a contagem
// para cada grupo de iniciais (não é um contador global).
export async function criarUsuario(iniciais: string): Promise<{ usuario: UsuarioPublico; senha: string }> {
  const iniciaisNormalizadas = iniciais?.trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (!iniciaisNormalizadas) {
    throw new BusinessLogicError([{ campo: "iniciais", mensagem: "Iniciais são obrigatórias (só letras)." }]);
  }

  const prefixo = `P${iniciaisNormalizadas}-`;
  const existentes = await prisma.usuario.findMany({
    where: { codigo: { startsWith: prefixo } },
    select: { codigo: true },
  });
  const maiorSequencial = existentes.reduce((maior, u) => {
    const numero = Number(u.codigo.slice(prefixo.length));
    return Number.isFinite(numero) && numero > maior ? numero : maior;
  }, 0);
  const codigo = `${prefixo}${String(maiorSequencial + 1).padStart(2, "0")}`;

  const senha = gerarSenhaAleatoria();
  const usuario = await prisma.usuario.create({
    data: { codigo, senhaHash: hashSenha(senha) },
  });

  return { usuario: { id: usuario.id, codigo: usuario.codigo }, senha };
}
