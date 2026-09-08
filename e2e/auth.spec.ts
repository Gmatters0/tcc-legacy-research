import { expect, test } from "@playwright/test";
import { criarUsuarioTeste } from "./helpers/db";
import { login } from "./helpers/auth";

test.describe("Autenticação de participante", () => {
  test("login com credenciais corretas mostra o setup da tarefa", async ({ page }) => {
    const usuario = await criarUsuarioTeste("AUTH");
    await login(page, usuario.codigo, usuario.senha);

    await expect(page.getByText(`Logado como ${usuario.codigo}`)).toBeVisible();
    await expect(page.getByRole("button", { name: "Iniciar Tarefa" })).toBeVisible();
  });

  test("login com senha errada mostra mensagem de erro e não entra", async ({ page }) => {
    const usuario = await criarUsuarioTeste("AUTHBAD");
    await login(page, usuario.codigo, "senha-errada-com-certeza");

    await expect(page.getByText("Código ou senha inválidos.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Iniciar Tarefa" })).not.toBeVisible();
  });

  test("logout volta para a tela de login", async ({ page }) => {
    const usuario = await criarUsuarioTeste("AUTHOUT");
    await login(page, usuario.codigo, usuario.senha);
    await page.getByRole("button", { name: "sair" }).click();

    await expect(page.getByPlaceholder("Ex: PJS-01")).toBeVisible();
  });
});

test.describe("Proteção de rota (proxy.ts)", () => {
  test("acesso direto a /cenario-a sem login redireciona para a home", async ({ page }) => {
    await page.goto("/cenario-a");
    await expect(page).toHaveURL("/");
    await expect(page.getByPlaceholder("Ex: PJS-01")).toBeVisible();
  });

  test("acesso direto a /cenario-b sem login redireciona para a home", async ({ page }) => {
    await page.goto("/cenario-b");
    await expect(page).toHaveURL("/");
  });

  test("acesso direto a /sucesso sem login redireciona para a home", async ({ page }) => {
    await page.goto("/sucesso");
    await expect(page).toHaveURL("/");
  });

  test("/obrigado continua acessível sem login (fim do fluxo, usuário já desautenticado)", async ({ page }) => {
    await page.goto("/obrigado");
    await expect(page).toHaveURL("/obrigado");
    await expect(page.getByRole("heading", { name: "Obrigado pela sua participação!" })).toBeVisible();
  });
});

test.describe("Rotas de negócio exigem login (rede de segurança pós-hospedagem)", () => {
  test("POST /api/notas-fiscais sem cookie de sessão retorna 401", async ({ request }) => {
    const resposta = await request.post("/api/notas-fiscais", {
      data: { numero: "999999", fornecedor: "x", dataEmissao: "2026-01-01", valorTotal: 1 },
    });
    expect(resposta.status()).toBe(401);
  });

  test("POST /api/eventos-erro sem cookie de sessão retorna 401", async ({ request }) => {
    const resposta = await request.post("/api/eventos-erro", {
      data: { sessaoId: "inexistente", tipo: "CLIQUE_FORA_FLUXO" },
    });
    expect(resposta.status()).toBe(401);
  });
});
