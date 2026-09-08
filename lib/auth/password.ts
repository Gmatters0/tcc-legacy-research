import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// node:crypto em vez de uma dependência de hashing — evita adicionar mais um
// módulo nativo (o projeto já lida com aprovação de build scripts do pnpm
// pro Prisma; scrypt do Node cobre a necessidade sem mais um).
const KEYLEN = 64;

export function hashSenha(senha: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(senha, salt, KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verificarSenha(senha: string, senhaHash: string): boolean {
  const [salt, hash] = senhaHash.split(":");
  if (!salt || !hash) return false;

  const hashCalculado = scryptSync(senha, salt, KEYLEN);
  const hashArmazenado = Buffer.from(hash, "hex");
  if (hashCalculado.length !== hashArmazenado.length) return false;

  return timingSafeEqual(hashCalculado, hashArmazenado);
}

// Sem 0/O/1/l/I — evita ambiguidade quando o pesquisador lê a senha em voz
// alta ou digita a partir de uma anotação em papel para passar ao participante.
const ALFABETO_SENHA = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

export function gerarSenhaAleatoria(tamanho = 10): string {
  return Array.from(randomBytes(tamanho), (byte) => ALFABETO_SENHA[byte % ALFABETO_SENHA.length]).join("");
}
