import { expect, test } from "@playwright/test";
import { buscarComparacaoFinal, buscarUsuarioAtivo, contarAvaliacoes, criarUsuarioTeste, gerarNumeroNfTeste } from "./helpers/db";
import { iniciarTarefa, login } from "./helpers/auth";
import { completarAvaliacaoPosTarefa, completarCenarioA, completarCenarioB, completarComparacaoFinal } from "./helpers/fluxo";

test.describe("Regra de não-repetição", () => {
  test("cenário e conjunto já concluídos saem das opções e vêm travados", async ({ page }) => {
    const usuario = await criarUsuarioTeste("NOREP");
    await login(page, usuario.codigo, usuario.senha);
    await iniciarTarefa(page, { perfil: "TECNICO", cenario: "A", conjunto: "conjunto-1" });
    await completarCenarioA(page, gerarNumeroNfTeste());
    await expect(page).toHaveURL(/\/sucesso\?sessaoId=/, { timeout: 15_000 });

    // A avaliação pós-tarefa (NASA-TLX → SUS → subjetivo) roda automaticamente
    // e, como ainda sobra Cenário B/conjunto-2, redireciona sozinha pra home.
    await completarAvaliacaoPosTarefa(page);
    await expect(page).toHaveURL("/", { timeout: 15_000 });
    await expect(page.getByText(/^Logado como/)).toBeVisible();

    // O perfil informado no primeiro cenário vem selecionado e travado.
    const selectPerfil = page.locator("select").nth(0);
    await expect(selectPerfil).toBeDisabled();
    await expect(selectPerfil).toHaveValue("TECNICO");

    // Só sobrou Cenário B e Conjunto 2 — os dois <select> vêm travados.
    const selectCenario = page.locator("select").nth(1);
    const selectConjunto = page.locator("select").nth(2);
    await expect(selectCenario).toBeDisabled();
    await expect(selectCenario).toHaveValue("B");
    await expect(selectConjunto).toBeDisabled();
    await expect(selectConjunto).toHaveValue("conjunto-2");

    expect(await contarAvaliacoes(usuario.id)).toBe(1);
  });

  test("servidor rejeita repetição mesmo contornando a UI", async ({ page }) => {
    const usuario = await criarUsuarioTeste("NOREPAPI");
    await login(page, usuario.codigo, usuario.senha);
    await iniciarTarefa(page, { perfil: "TECNICO", cenario: "A", conjunto: "conjunto-1" });
    await completarCenarioA(page, gerarNumeroNfTeste());
    await expect(page).toHaveURL(/\/sucesso\?sessaoId=/, { timeout: 15_000 });

    // Chamada direta à API pedindo o mesmo cenário/conjunto já concluído —
    // o cookie de sessão do participante viaja junto (page.request). Não
    // precisa passar pela avaliação pós-tarefa pra testar isso.
    const resposta = await page.request.post("/api/sessoes", {
      data: { perfilUsuario: "TECNICO", cenario: "A", conjuntoTarefa: "conjunto-1" },
    });
    expect(resposta.status()).toBe(400);
  });
});

test.describe("Fluxo completo e telas de encerramento", () => {
  test("os dois cenários levam à comparação final, desativam o usuário e chegam em /obrigado", async ({ page }) => {
    // Só existem 2 sessões possíveis por usuário no total (ver
    // validarElegibilidade): depois de A/conjunto-1, só sobra B/conjunto-2.
    const usuario = await criarUsuarioTeste("FLUXOCOMPLETO");
    await login(page, usuario.codigo, usuario.senha);

    await iniciarTarefa(page, { perfil: "NAO_TECNICO", cenario: "A", conjunto: "conjunto-1" });
    await completarCenarioA(page, gerarNumeroNfTeste());
    await expect(page).toHaveURL(/\/sucesso\?sessaoId=/, { timeout: 15_000 });
    await completarAvaliacaoPosTarefa(page);

    // Primeiro cenário: ainda sobra o segundo, então volta pra home sozinho.
    await expect(page).toHaveURL("/", { timeout: 15_000 });
    await expect(page.getByText(/^Logado como/)).toBeVisible();
    expect(await buscarUsuarioAtivo(usuario.id)).toEqual({ ativo: true });

    await iniciarTarefa(page, { perfil: "NAO_TECNICO", cenario: "B", conjunto: "conjunto-2" });
    await completarCenarioB(page, gerarNumeroNfTeste());
    await expect(page).toHaveURL(/\/sucesso\?sessaoId=/, { timeout: 15_000 });
    await completarAvaliacaoPosTarefa(page);

    // Segundo (último) cenário: cai na comparação final em vez de voltar pra home.
    await expect(page.getByRole("heading", { name: "Cenário A vs. Cenário B" })).toBeVisible({ timeout: 15_000 });
    await completarComparacaoFinal(page, "B");

    await expect(page).toHaveURL("/obrigado", { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Obrigado pela sua participação!" })).toBeVisible();

    expect(await contarAvaliacoes(usuario.id)).toBe(2);
    const comparacao = await buscarComparacaoFinal(usuario.id);
    expect(comparacao?.preferencia).toBe("B");
    expect(await buscarUsuarioAtivo(usuario.id)).toEqual({ ativo: false });

    // Usuário já desativado — login deixa de funcionar.
    await login(page, usuario.codigo, usuario.senha);
    await expect(page.getByText("Código ou senha inválidos.")).toBeVisible();

    // /obrigado continua acessível (é rota pública) mesmo depois de tudo isso.
    await page.goto("/obrigado");
    await expect(page.getByRole("heading", { name: "Obrigado pela sua participação!" })).toBeVisible();
  });
});
