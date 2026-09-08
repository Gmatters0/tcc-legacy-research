#!/usr/bin/env node
"use strict";

// Cria um Usuario de teste local para validar o fluxo de login. Ferramenta de
// apoio ao desenvolvimento — NÃO é a criação real de participantes: isso é
// escopo do painel administrativo, que gera código no padrão
// P[Iniciais]-Sequencial e senha aleatória via UI.
// Uso: `pnpm run seed:usuario -- <codigo> <senha>`
// Ex:  `pnpm run seed:usuario -- PJS-01 minhasenha123`

require("dotenv/config");
const crypto = require("node:crypto");
const { Client } = require("pg");

// Precisa produzir o mesmo formato "salt:hash" que lib/auth/password.ts
// (hashSenha), já que é essa função que o login (app/api/auth/login) usa
// para verificar a senha.
const KEYLEN = 64;

function hashSenha(senha) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(senha, salt, KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  // `pnpm run seed:usuario -- <codigo> <senha>` repassa o "--" literal como
  // argumento (mesma pegadinha já tratada em reset-db.js) — filtra antes de
  // ler os argumentos posicionais.
  const [codigo, senha] = process.argv.slice(2).filter((arg) => arg !== "--");
  if (!codigo || !senha) {
    console.error("Uso: pnpm run seed:usuario -- <codigo> <senha>");
    process.exitCode = 1;
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL ausente. Verifique o .env.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const existente = await client.query('SELECT id FROM "Usuario" WHERE codigo = $1', [codigo]);
  if (existente.rows.length) {
    console.log(`Usuário "${codigo}" já existe (id: ${existente.rows[0].id}). Nada a fazer.`);
    await client.end();
    return;
  }

  const id = crypto.randomUUID();
  await client.query('INSERT INTO "Usuario" (id, codigo, "senhaHash", ativo) VALUES ($1, $2, $3, true)', [
    id,
    codigo,
    hashSenha(senha),
  ]);

  console.log(`Usuário de teste criado: código "${codigo}", senha "${senha}" (id: ${id}).`);
  await client.end();
}

main().catch((erro) => {
  console.error("Falha ao criar usuário de teste:", erro);
  process.exitCode = 1;
});
