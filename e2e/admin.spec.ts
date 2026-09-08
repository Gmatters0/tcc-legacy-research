import { expect, test } from "@playwright/test";
import { letrasAleatorias, PREFIXO_INICIAIS_ADMIN_TESTE } from "./helpers/db";

const ADMIN_SENHA = process.env.ADMIN_SENHA;
if (!ADMIN_SENHA) {
  throw new Error("ADMIN_SENHA não está definida no .env — necessária para os testes do painel admin.");
}

async function loginAdmin(page: import("@playwright/test").Page, senha: string) {
  await page.goto("/admin");
  await page.locator('input[type="password"]').fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
}

test.describe("Autenticação do painel administrativo", () => {
  test("senha incorreta mostra erro e não entra", async ({ page }) => {
    await loginAdmin(page, "senha-incorreta-com-certeza");
    await expect(page.getByText("Senha inválida.")).toBeVisible();
    await expect(page.getByText("Painel Administrativo")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Usuários" })).not.toBeVisible();
  });

  test("senha correta abre o dashboard, e logout volta ao login", async ({ page }) => {
    await loginAdmin(page, ADMIN_SENHA!);
    await expect(page.getByRole("heading", { name: "Usuários" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Sessões/ })).toBeVisible();

    await page.getByRole("button", { name: "sair" }).click();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Usuários" })).not.toBeVisible();
  });

  test("cookie de admin é de sessão do navegador (sem persistência entre reinícios)", async ({ page, context }) => {
    await loginAdmin(page, ADMIN_SENHA!);
    await expect(page.getByRole("heading", { name: "Usuários" })).toBeVisible();

    const cookies = await context.cookies();
    const cookieAdmin = cookies.find((c) => c.name === "sessao_admin");
    expect(cookieAdmin).toBeDefined();
    // expires === -1 é como o Playwright/Chromium representa um cookie de
    // sessão (sem Max-Age/Expires) — é exatamente essa a garantia pedida:
    // expira ao fechar o navegador, nunca fica "lembrado".
    expect(cookieAdmin?.expires).toBe(-1);
  });
});

test.describe("Painel administrativo — gestão de usuários", () => {
  test("cria um usuário com código no formato P[Iniciais]-Sequencial e senha exibida uma vez", async ({ page }) => {
    await loginAdmin(page, ADMIN_SENHA!);
    await expect(page.getByRole("heading", { name: "Usuários" })).toBeVisible();

    const iniciaisUnicas = `${PREFIXO_INICIAIS_ADMIN_TESTE}${letrasAleatorias()}`;
    await page.getByPlaceholder("Ex: JS").fill(iniciaisUnicas);
    await page.getByRole("button", { name: "Criar usuário" }).click();

    // Sequencial (P[Iniciais]-NN) não é previsível de antemão — reinicia por
    // grupo de iniciais, mas essas iniciais nunca foram usadas antes nesta
    // suíte, então basta capturar o valor real gerado.
    const linhaConfirmacao = page.getByText(new RegExp(`Usuário (P${iniciaisUnicas}-\\d+) criado`));
    await expect(linhaConfirmacao).toBeVisible();
    const textoConfirmacao = (await linhaConfirmacao.textContent()) ?? "";
    const codigo = textoConfirmacao.match(new RegExp(`P${iniciaisUnicas}-\\d+`))![0];

    // A senha só aparece nessa confirmação, gerada sem caracteres ambíguos
    // (0/O/1/l/I — ver gerarSenhaAleatoria). Isola só a senha antes de checar
    // — o resto da frase (código com sequencial, "Anote") tem dígitos/letras
    // ambíguas legítimas.
    const senha = textoConfirmacao.match(/senha: ([A-Za-z2-9]+)\./)?.[1];
    expect(senha).toBeTruthy();
    expect(senha).not.toMatch(/[0O1lI]/);

    await expect(page.getByRole("cell", { name: codigo })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Ativo" }).first()).toBeVisible();
  });

  test("desativar e reativar usuário via toggle", async ({ page }) => {
    await loginAdmin(page, ADMIN_SENHA!);
    await expect(page.getByRole("heading", { name: "Usuários" })).toBeVisible();

    const iniciaisUnicas = `${PREFIXO_INICIAIS_ADMIN_TESTE}${letrasAleatorias()}T`;
    await page.getByPlaceholder("Ex: JS").fill(iniciaisUnicas);
    await page.getByRole("button", { name: "Criar usuário" }).click();
    const linhaConfirmacao = page.getByText(new RegExp(`Usuário (P${iniciaisUnicas}-\\d+) criado`));
    await expect(linhaConfirmacao).toBeVisible();
    const textoConfirmacao = (await linhaConfirmacao.textContent()) ?? "";
    const codigo = textoConfirmacao.match(new RegExp(`P${iniciaisUnicas}-\\d+`))![0];

    const linha = page.locator("tr", { hasText: codigo });
    await expect(linha.getByText("Ativo")).toBeVisible();

    await linha.getByRole("button", { name: "Desativar" }).click();
    await expect(linha.getByText("Inativo")).toBeVisible();

    await linha.getByRole("button", { name: "Reativar" }).click();
    await expect(linha.getByText("Ativo")).toBeVisible();
  });
});
