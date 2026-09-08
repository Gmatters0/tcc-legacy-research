import { Client } from "pg";
import { PREFIXO_CODIGO_TESTE, PREFIXO_INICIAIS_ADMIN_TESTE, PREFIXO_NF_TESTE } from "./db";

// Roda uma vez ao final da suíte inteira (independente de sucesso/falha de
// testes individuais) e apaga só o que os smoke tests criaram, identificado
// pelos prefixos reconhecíveis — nunca toca em Usuario/NotaFiscal reais.
export default async function globalTeardown() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const usuarios = await client.query(
      'SELECT id FROM "Usuario" WHERE codigo LIKE $1 OR codigo LIKE $2',
      [`${PREFIXO_CODIGO_TESTE}%`, `P${PREFIXO_INICIAIS_ADMIN_TESTE}%-%`],
    );
    const usuarioIds = usuarios.rows.map((r) => r.id);

    if (usuarioIds.length) {
      const sessoes = await client.query('SELECT id FROM "SessaoTeste" WHERE "usuarioId" = ANY($1)', [usuarioIds]);
      const sessaoIds = sessoes.rows.map((r) => r.id);
      if (sessaoIds.length) {
        // EventoErro tem onDelete: Cascade a partir de SessaoTeste, mas apaga
        // explicitamente por clareza (não depende de a constraint existir).
        await client.query('DELETE FROM "EventoErro" WHERE "sessaoId" = ANY($1)', [sessaoIds]);
        await client.query('DELETE FROM "SessaoTeste" WHERE id = ANY($1)', [sessaoIds]);
      }
      await client.query('DELETE FROM "Usuario" WHERE id = ANY($1)', [usuarioIds]);
    }

    const notas = await client.query('SELECT id FROM "NotaFiscal" WHERE numero LIKE $1', [`${PREFIXO_NF_TESTE}%`]);
    const notaIds = notas.rows.map((r) => r.id);
    if (notaIds.length) {
      await client.query('DELETE FROM "ItemRecebido" WHERE "notaFiscalId" = ANY($1)', [notaIds]);
      await client.query('DELETE FROM "LancamentoEstoque" WHERE "notaFiscalId" = ANY($1)', [notaIds]);
      await client.query('DELETE FROM "NotaFiscal" WHERE id = ANY($1)', [notaIds]);
    }

    console.log(
      `[e2e] limpeza: ${usuarioIds.length} usuário(s) de teste e ${notaIds.length} nota(s) fiscal(is) de teste removidos.`,
    );
  } finally {
    await client.end();
  }
}
