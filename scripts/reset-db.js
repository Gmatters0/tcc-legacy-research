#!/usr/bin/env node
"use strict";

// Zera a base de dados (Postgres, via Prisma Postgres) para começar uma
// rodada de testes do zero. Uso: `pnpm run db:reset` (pede confirmação
// interativa) ou `pnpm run db:reset -- --yes` (pula a confirmação, útil em
// automação).

require("dotenv/config");
const readline = require("node:readline");
const { Client } = require("pg");

// Ordem respeita as dependências de chave estrangeira (filhos antes dos pais)
// mesmo onde não há ON DELETE CASCADE configurado.
const TABELAS_EM_ORDEM_DE_EXCLUSAO = ["EventoErro", "ItemRecebido", "LancamentoEstoque", "NotaFiscal", "SessaoTeste"];

async function contarRegistros(client) {
  const contagens = {};
  for (const tabela of TABELAS_EM_ORDEM_DE_EXCLUSAO) {
    const { rows } = await client.query(`SELECT COUNT(*)::int AS total FROM "${tabela}"`);
    contagens[tabela] = rows[0].total;
  }
  return contagens;
}

function imprimirContagens(contagens) {
  for (const [tabela, total] of Object.entries(contagens)) {
    console.log(`  ${tabela}: ${total}`);
  }
}

function perguntar(pergunta) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(pergunta, (resposta) => {
      rl.close();
      resolve(resposta);
    });
  });
}

async function main() {
  const confirmadoPorFlag = process.argv.slice(2).some((arg) => arg === "--yes" || arg === "-y");

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL ausente. Verifique o .env.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const contagensAntes = await contarRegistros(client);
  const totalAntes = Object.values(contagensAntes).reduce((soma, n) => soma + n, 0);

  console.log("Registros atuais:");
  imprimirContagens(contagensAntes);

  if (totalAntes === 0) {
    console.log("\nO banco já está vazio. Nada a fazer.");
    await client.end();
    return;
  }

  if (!confirmadoPorFlag) {
    const resposta = await perguntar(
      `\nIsso vai APAGAR PERMANENTEMENTE ${totalAntes} registro(s) em todas as tabelas.\nDigite "CONFIRMAR" para continuar: `,
    );
    if (resposta.trim() !== "CONFIRMAR") {
      console.log("Operação cancelada — nenhum dado foi apagado.");
      await client.end();
      return;
    }
  }

  try {
    await client.query("BEGIN");
    for (const tabela of TABELAS_EM_ORDEM_DE_EXCLUSAO) {
      await client.query(`DELETE FROM "${tabela}"`);
    }
    await client.query("COMMIT");
  } catch (erro) {
    await client.query("ROLLBACK");
    throw erro;
  }

  console.log("\nBanco de dados zerado. Registros restantes:");
  imprimirContagens(await contarRegistros(client));

  await client.end();
}

main().catch((erro) => {
  console.error("Falha ao zerar o banco de dados:", erro);
  process.exitCode = 1;
});
