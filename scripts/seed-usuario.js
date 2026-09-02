#!/usr/bin/env node
"use strict";

// Cria um Usuario de teste local para validar o fluxo de login (Sprint 0).
// Ferramenta de apoio ao desenvolvimento — NÃO é a criação real de
// participantes: isso é escopo do painel administrativo (Sprint 3), que vai
// gerar código no padrão P[Iniciais]-Sequencial e senha aleatória via UI.
// Uso: `pnpm run seed:usuario -- <codigo> <senha>`
// Ex:  `pnpm run seed:usuario -- PJS-01 minhasenha123`

require("dotenv/config");
const path = require("node:path");
const crypto = require("node:crypto");
const Database = require("better-sqlite3");

// Precisa produzir o mesmo formato "salt:hash" que lib/auth/password.ts
// (hashSenha), já que é essa função que o login (app/api/auth/login) usa
// para verificar a senha.
const KEYLEN = 64;

function hashSenha(senha) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(senha, salt, KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

function resolverCaminhoBanco() {
  const url = process.env.DATABASE_URL;
  if (!url || !url.startsWith("file:")) {
    throw new Error(`DATABASE_URL inválida ou ausente (esperado "file:./dev.db", recebido "${url}"). Verifique o .env.`);
  }
  return path.resolve(process.cwd(), url.replace(/^file:/, ""));
}

function main() {
  // `pnpm run seed:usuario -- <codigo> <senha>` repassa o "--" literal como
  // argumento (mesma pegadinha já tratada em reset-db.js) — filtra antes de
  // ler os argumentos posicionais.
  const [codigo, senha] = process.argv.slice(2).filter((arg) => arg !== "--");
  if (!codigo || !senha) {
    console.error("Uso: pnpm run seed:usuario -- <codigo> <senha>");
    process.exitCode = 1;
    return;
  }

  const db = new Database(resolverCaminhoBanco());

  const existente = db.prepare(`SELECT id FROM "Usuario" WHERE codigo = ?`).get(codigo);
  if (existente) {
    console.log(`Usuário "${codigo}" já existe (id: ${existente.id}). Nada a fazer.`);
    db.close();
    return;
  }

  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO "Usuario" (id, codigo, senhaHash, ativo, createdAt) VALUES (?, ?, ?, 1, ?)`,
  ).run(id, codigo, hashSenha(senha), new Date().toISOString());

  console.log(`Usuário de teste criado: código "${codigo}", senha "${senha}" (id: ${id}).`);
  db.close();
}

main();
