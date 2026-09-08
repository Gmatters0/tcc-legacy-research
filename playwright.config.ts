import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

// Smoke tests ponta a ponta — rodam contra um servidor Next.js real (dev)
// conectado ao Postgres real (DATABASE_URL do .env). Não usam banco separado
// de teste: cada teste cria seus próprios Usuario/NotaFiscal com prefixos
// reconhecíveis (ver e2e/helpers/db.ts) e o globalTeardown limpa tudo no
// final. Rode `pnpm run db:reset` depois, antes de qualquer coleta real.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  // Sequencial de propósito: POST /api/sessoes limpa QUALQUER SessaoTeste não
  // finalizada no banco inteiro como rede de segurança (ver comentário na
  // rota) — por design, a aplicação assume um único participante/sessão por
  // vez (não é multi-tenant). Rodar testes em paralelo faz um teste apagar a
  // sessão em andamento de outro, quebrando o experimento real.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  globalTeardown: "./e2e/helpers/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
