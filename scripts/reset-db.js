#!/usr/bin/env node
"use strict";

// Zera a base de dados local (SQLite) para começar uma rodada de testes do
// zero. Uso: `pnpm run db:reset` (pede confirmação interativa) ou
// `pnpm run db:reset -- --yes` (pula a confirmação, útil em automação).

require("dotenv/config");
const path = require("node:path");
const readline = require("node:readline");
const Database = require("better-sqlite3");

// Ordem respeita as dependências de chave estrangeira (filhos antes dos pais)
// mesmo onde não há ON DELETE CASCADE configurado.
const TABELAS_EM_ORDEM_DE_EXCLUSAO = ["EventoErro", "ItemRecebido", "LancamentoEstoque", "NotaFiscal", "SessaoTeste"];

function resolverCaminhoBanco() {
  const url = process.env.DATABASE_URL;
  if (!url || !url.startsWith("file:")) {
    throw new Error(`DATABASE_URL inválida ou ausente (esperado "file:./dev.db", recebido "${url}"). Verifique o .env.`);
  }
  return path.resolve(process.cwd(), url.replace(/^file:/, ""));
}

function contarRegistros(db) {
  const contagens = {};
  for (const tabela of TABELAS_EM_ORDEM_DE_EXCLUSAO) {
    contagens[tabela] = db.prepare(`SELECT COUNT(*) as total FROM "${tabela}"`).get().total;
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
  const caminhoBanco = resolverCaminhoBanco();

  const db = new Database(caminhoBanco);
  db.pragma("foreign_keys = ON");

  const contagensAntes = contarRegistros(db);
  const totalAntes = Object.values(contagensAntes).reduce((soma, n) => soma + n, 0);

  console.log(`Banco de dados: ${caminhoBanco}`);
  console.log("Registros atuais:");
  imprimirContagens(contagensAntes);

  if (totalAntes === 0) {
    console.log("\nO banco já está vazio. Nada a fazer.");
    db.close();
    return;
  }

  if (!confirmadoPorFlag) {
    const resposta = await perguntar(
      `\nIsso vai APAGAR PERMANENTEMENTE ${totalAntes} registro(s) em todas as tabelas.\nDigite "CONFIRMAR" para continuar: `,
    );
    if (resposta.trim() !== "CONFIRMAR") {
      console.log("Operação cancelada — nenhum dado foi apagado.");
      db.close();
      return;
    }
  }

  const apagarTudo = db.transaction(() => {
    for (const tabela of TABELAS_EM_ORDEM_DE_EXCLUSAO) {
      db.prepare(`DELETE FROM "${tabela}"`).run();
    }
  });
  apagarTudo();

  console.log("\nBanco de dados zerado. Registros restantes:");
  imprimirContagens(contarRegistros(db));

  db.close();
}

main().catch((erro) => {
  console.error("Falha ao zerar o banco de dados:", erro);
  process.exitCode = 1;
});
