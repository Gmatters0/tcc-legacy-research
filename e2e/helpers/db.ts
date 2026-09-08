import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { Client } from "pg";

// Prefixos reconhecíveis para tudo que os smoke tests criam — é isso que o
// global-teardown usa para limpar sem tocar em dado real de participante.
export const PREFIXO_CODIGO_TESTE = "E2E-";
export const PREFIXO_NF_TESTE = "99";
// Iniciais usadas pelos testes do painel admin (que criam Usuario via
// criarUsuario(), formato "P[Iniciais]-Sequencial" — não passa por
// criarUsuarioTeste() acima, então não ganha o prefixo "E2E-" comum).
// criarUsuario() normaliza iniciais para só-letras (remove dígitos), então
// esse marcador precisa ser só letras — "ZZ" não é uma dupla de iniciais
// plausível de participante real.
export const PREFIXO_INICIAIS_ADMIN_TESTE = "ZZ";

// 4 letras pseudo-aleatórias (A-Z) a partir de Date.now() — só para dar
// unicidade às iniciais de teste; sequencial de criarUsuario() já desambigua
// mesmo em colisão.
export function letrasAleatorias(): string {
  let n = Date.now() % 456976; // 26^4
  let letras = "";
  for (let i = 0; i < 4; i++) {
    letras = String.fromCharCode(65 + (n % 26)) + letras;
    n = Math.floor(n / 26);
  }
  return letras;
}

const KEYLEN = 64;

// Mesmo formato "salt:hash" de lib/auth/password.ts — precisa bater com o
// que POST /api/auth/login espera verificar.
function hashSenha(senha: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(senha, salt, KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

async function withDb<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export interface UsuarioTeste {
  id: string;
  codigo: string;
  senha: string;
}

export async function criarUsuarioTeste(rotulo: string): Promise<UsuarioTeste> {
  const sufixo = randomBytes(3).toString("hex").toUpperCase();
  const codigo = `${PREFIXO_CODIGO_TESTE}${rotulo}-${sufixo}`;
  const senha = "senhaTeste123";
  const id = randomUUID();

  await withDb((client) =>
    client.query('INSERT INTO "Usuario" (id, codigo, "senhaHash", ativo) VALUES ($1, $2, $3, true)', [
      id,
      codigo,
      hashSenha(senha),
    ]),
  );

  return { id, codigo, senha };
}

export function gerarNumeroNfTeste(): string {
  // Só dígitos (regra de negócio), prefixo "99" reconhecível pelo teardown —
  // nenhum conjunto de tarefa real usa números começando em 99.
  return `${PREFIXO_NF_TESTE}${Date.now() % 1_0000000}`;
}

export async function buscarUsuarioAtivo(id: string): Promise<{ ativo: boolean } | null> {
  return withDb(async (client) => {
    const { rows } = await client.query('SELECT ativo FROM "Usuario" WHERE id = $1', [id]);
    return rows[0] ?? null;
  });
}

export async function buscarUltimaSessao(usuarioId: string) {
  return withDb(async (client) => {
    const { rows } = await client.query(
      'SELECT * FROM "SessaoTeste" WHERE "usuarioId" = $1 ORDER BY "timestampInicio" DESC LIMIT 1',
      [usuarioId],
    );
    return rows[0] ?? null;
  });
}

export async function buscarEventosErro(sessaoId: string): Promise<{ tipo: string; detalhe: string | null }[]> {
  return withDb(async (client) => {
    const { rows } = await client.query('SELECT tipo, detalhe FROM "EventoErro" WHERE "sessaoId" = $1', [sessaoId]);
    return rows;
  });
}

export async function buscarLancamentoPorNf(notaFiscalId: string) {
  return withDb(async (client) => {
    const { rows } = await client.query('SELECT * FROM "LancamentoEstoque" WHERE "notaFiscalId" = $1', [
      notaFiscalId,
    ]);
    return rows[0] ?? null;
  });
}

export async function buscarNotaFiscalPorNumero(numero: string) {
  return withDb(async (client) => {
    const { rows } = await client.query('SELECT * FROM "NotaFiscal" WHERE numero = $1', [numero]);
    return rows[0] ?? null;
  });
}
