import { expect, test } from "@playwright/test";
import { buscarUsuarioAtivo, criarUsuarioTeste, gerarNumeroNfTeste } from "./helpers/db";
import { iniciarTarefa, login } from "./helpers/auth";
import { completarCenarioA, completarCenarioB } from "./helpers/fluxo";

test.describe("Regra de não-repetição", () => {
  test("cenário e conjunto já concluídos saem das opções e vêm travados", async ({ page }) => {
    const usuario = await criarUsuarioTeste("NOREP");
    await login(page, usuario.codigo, usuario.senha);
    await iniciarTarefa(page, { perfil: "TECNICO", cenario: "A", conjunto: "conjunto-1" });
    await completarCenarioA(page, gerarNumeroNfTeste());
    await expect(page).toHaveURL("/sucesso", { timeout: 15_000 });

    await page.getByRole("button", { name: "Voltar à tela inicial" }).click();
    await expect(page.getByText(/^Logado como/)).toBeVisible();

    // Só sobrou Cenário B e Conjunto 2 — os dois <select> vêm travados.
    const selectCenario = page.locator("select").nth(1);
    const selectConjunto = page.locator("select").nth(2);
    await expect(selectCenario).toBeDisabled();
    await expect(selectCenario).toHaveValue("B");
    await expect(selectConjunto).toBeDisabled();
    await expect(selectConjunto).toHaveValue("conjunto-2");
  });

  test("servidor rejeita repetição mesmo contornando a UI", async ({ page }) => {
    const usuario = await criarUsuarioTeste("NOREPAPI");
    await login(page, usuario.codigo, usuario.senha);
    await iniciarTarefa(page, { perfil: "TECNICO", cenario: "A", conjunto: "conjunto-1" });
    await completarCenarioA(page, gerarNumeroNfTeste());
    await expect(page).toHaveURL("/sucesso", { timeout: 15_000 });

    // Chamada direta à API pedindo o mesmo cenário/conjunto já concluído —
    // o cookie de sessão do participante viaja junto (page.request).
    const resposta = await page.request.post("/api/sessoes", {
      data: { perfilUsuario: "TECNICO", cenario: "A", conjuntoTarefa: "conjunto-1" },
    });
    expect(resposta.status()).toBe(400);
  });

  test("participação concluída após esgotar cenário e conjunto disponíveis", async ({ page }) => {
    // A regra bloqueia por cenário E por conjunto de forma independente (ver
    // validarElegibilidade): depois de A/conjunto-1, só sobra B/conjunto-2 —
    // nunca A/conjunto-2 nem B/conjunto-1. Só existem 2 sessões possíveis por
    // usuário no total, não as 4 combinações.
    const usuario = await criarUsuarioTeste("NOREPFULL");
    await login(page, usuario.codigo, usuario.senha);

    const combinacoes: { cenario: "A" | "B"; conjunto: "conjunto-1" | "conjunto-2" }[] = [
      { cenario: "A", conjunto: "conjunto-1" },
      { cenario: "B", conjunto: "conjunto-2" },
    ];

    for (const combinacao of combinacoes) {
      await expect(page.getByText(/^Logado como/)).toBeVisible();
      await iniciarTarefa(page, { perfil: "NAO_TECNICO", ...combinacao });
      const numero = gerarNumeroNfTeste();
      if (combinacao.cenario === "A") {
        await completarCenarioA(page, numero);
      } else {
        await completarCenarioB(page, numero);
      }
      await expect(page).toHaveURL("/sucesso", { timeout: 15_000 });
      await page.getByRole("button", { name: "Voltar à tela inicial" }).click();
    }

    await expect(page.getByText("Você já concluiu sua participação nesta pesquisa")).toBeVisible();
    expect(await buscarUsuarioAtivo(usuario.id)).toEqual({ ativo: true });
  });
});

test.describe("Telas de encerramento", () => {
  test("Finalizar participação desativa o usuário e impede novo login", async ({ page }) => {
    const usuario = await criarUsuarioTeste("ENCERRA");
    await login(page, usuario.codigo, usuario.senha);
    await iniciarTarefa(page, { perfil: "NAO_TECNICO", cenario: "A", conjunto: "conjunto-1" });
    await completarCenarioA(page, gerarNumeroNfTeste());
    await expect(page).toHaveURL("/sucesso", { timeout: 15_000 });

    await page.getByRole("button", { name: "Finalizar participação" }).click();
    await expect(page).toHaveURL("/obrigado");
    await expect(page.getByRole("heading", { name: "Obrigado pela sua participação!" })).toBeVisible();

    expect(await buscarUsuarioAtivo(usuario.id)).toEqual({ ativo: false });

    await login(page, usuario.codigo, usuario.senha);
    await expect(page.getByText("Código ou senha inválidos.")).toBeVisible();
  });

  test("/obrigado permanece acessível mesmo após o usuário ser desautenticado", async ({ page }) => {
    const usuario = await criarUsuarioTeste("ENCERRA2");
    await login(page, usuario.codigo, usuario.senha);
    await iniciarTarefa(page, { perfil: "TECNICO", cenario: "B", conjunto: "conjunto-1" });
    await completarCenarioB(page, gerarNumeroNfTeste());
    await expect(page).toHaveURL("/sucesso", { timeout: 15_000 });

    await page.getByRole("button", { name: "Finalizar participação" }).click();
    await expect(page).toHaveURL("/obrigado");

    await page.reload();
    await expect(page).toHaveURL("/obrigado");
    await expect(page.getByRole("heading", { name: "Obrigado pela sua participação!" })).toBeVisible();
  });
});
