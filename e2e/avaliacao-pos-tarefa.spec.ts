import { expect, test } from "@playwright/test";
import { criarUsuarioTeste, gerarNumeroNfTeste } from "./helpers/db";
import { iniciarTarefa, login } from "./helpers/auth";
import { completarCenarioA } from "./helpers/fluxo";

test.describe("Avaliação pós-tarefa — validação client-side", () => {
  test("não avança do NASA-TLX sem tocar todos os controles", async ({ page }) => {
    const usuario = await criarUsuarioTeste("AVAL-TLX");
    await login(page, usuario.codigo, usuario.senha);
    await iniciarTarefa(page, { perfil: "TECNICO", cenario: "A", conjunto: "conjunto-1" });
    await completarCenarioA(page, gerarNumeroNfTeste());
    await expect(page).toHaveURL(/\/sucesso\?sessaoId=/, { timeout: 15_000 });

    await expect(page.getByRole("heading", { name: "Carga de Trabalho — NASA-TLX" })).toBeVisible();
    await page.getByRole("button", { name: "Próximo →" }).click();

    // Nenhum slider foi tocado — continua no Passo 1, com erro visível.
    await expect(page.getByRole("heading", { name: "Carga de Trabalho — NASA-TLX" })).toBeVisible();
    await expect(page.getByText(/item\(ns\) ainda não foram tocados/)).toBeVisible();
  });

  test("não avança do SUS sem responder todas as afirmações", async ({ page }) => {
    const usuario = await criarUsuarioTeste("AVAL-SUS");
    await login(page, usuario.codigo, usuario.senha);
    await iniciarTarefa(page, { perfil: "TECNICO", cenario: "A", conjunto: "conjunto-1" });
    await completarCenarioA(page, gerarNumeroNfTeste());
    await expect(page).toHaveURL(/\/sucesso\?sessaoId=/, { timeout: 15_000 });

    const sliders = page.locator('input[type="range"]');
    const valoresTlx = ["30", "10", "40", "20", "35", "15"];
    for (let i = 0; i < valoresTlx.length; i++) await sliders.nth(i).fill(valoresTlx[i]);
    await page.getByRole("button", { name: "Próximo →" }).click();

    await expect(page.getByRole("heading", { name: "Usabilidade do Sistema — SUS" })).toBeVisible();
    // Responde só o primeiro item, deixa os outros 9 em branco.
    await page.locator('input[type="radio"]').nth(2).check({ force: true });
    await page.getByRole("button", { name: "Próximo →" }).click();

    await expect(page.getByRole("heading", { name: "Usabilidade do Sistema — SUS" })).toBeVisible();
    await expect(page.getByText("Responda todas as afirmações antes de continuar.")).toBeVisible();
  });
});

test.describe("Avaliação pós-tarefa — segurança no servidor", () => {
  test("rejeita avaliação para sessão de outro usuário", async ({ page }) => {
    const dono = await criarUsuarioTeste("AVAL-DONO");
    const intruso = await criarUsuarioTeste("AVAL-INTRUSO");

    // Dono completa o cenário e chega em /sucesso — captura o sessaoId da URL.
    await login(page, dono.codigo, dono.senha);
    await iniciarTarefa(page, { perfil: "TECNICO", cenario: "A", conjunto: "conjunto-1" });
    await completarCenarioA(page, gerarNumeroNfTeste());
    await expect(page).toHaveURL(/\/sucesso\?sessaoId=/, { timeout: 15_000 });
    const sessaoId = new URL(page.url()).searchParams.get("sessaoId");

    // Desloga o dono (senão "/" mostra a home dele, não o formulário de
    // login) e entra como intruso, que tenta enviar avaliação pra sessão que
    // não é dele.
    await page.request.post("/api/auth/logout");
    await login(page, intruso.codigo, intruso.senha);
    await expect(page.getByText(/^Logado como/)).toBeVisible();
    const resposta = await page.request.post(`/api/sessoes/${sessaoId}/avaliacao`, {
      data: {
        tlx: { mental: 50, fisica: 50, temporal: 50, desempenho: 50, esforco: 50, frustracao: 50 },
        sus: [4, 2, 4, 2, 4, 2, 4, 2, 4, 2],
        subjetivo: [4, 4, 4, 4, 4, 4, 2, 4, 4, 4],
      },
    });
    expect(resposta.status()).toBe(400);
  });

  test("rejeita avaliação para sessão ainda não finalizada", async ({ page }) => {
    const usuario = await criarUsuarioTeste("AVAL-NAOFIM");
    await login(page, usuario.codigo, usuario.senha);
    await iniciarTarefa(page, { perfil: "TECNICO", cenario: "A", conjunto: "conjunto-1" });
    await expect(page).toHaveURL(/\/cenario-a\?sessaoId=/);
    const sessaoId = new URL(page.url()).searchParams.get("sessaoId");

    // Sessão criada mas a tarefa nunca foi salva — timestampFim continua nulo.
    const resposta = await page.request.post(`/api/sessoes/${sessaoId}/avaliacao`, {
      data: {
        tlx: { mental: 50, fisica: 50, temporal: 50, desempenho: 50, esforco: 50, frustracao: 50 },
        sus: [4, 2, 4, 2, 4, 2, 4, 2, 4, 2],
        subjetivo: [4, 4, 4, 4, 4, 4, 2, 4, 4, 4],
      },
    });
    expect(resposta.status()).toBe(400);
  });
});
