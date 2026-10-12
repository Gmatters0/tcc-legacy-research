import { expect, test } from "@playwright/test";
import { buscarEventosErro, buscarLancamentoPorNf, buscarNotaFiscalPorNumero, buscarUltimaSessao, criarUsuarioTeste, gerarNumeroNfTeste } from "./helpers/db";
import { iniciarTarefa, login } from "./helpers/auth";

async function entrarNoCenarioA(page: import("@playwright/test").Page, rotulo: string) {
  const usuario = await criarUsuarioTeste(rotulo);
  await login(page, usuario.codigo, usuario.senha);
  await iniciarTarefa(page, { perfil: "TECNICO", cenario: "A", conjunto: "conjunto-1" });
  await expect(page.getByRole("heading", { name: "Entrada de Nota Fiscal" })).toBeVisible();
  return usuario;
}

function fieldset(page: import("@playwright/test").Page, texto: string) {
  return page.locator("fieldset").filter({ hasText: texto });
}

test.describe("Cenário A — fluxo de sucesso", () => {
  test("completa a tarefa com divergência proposital e chega em /sucesso", async ({ page }) => {
    const usuario = await entrarNoCenarioA(page, "A-SUCESSO");
    const numero = gerarNumeroNfTeste();

    const validacao = fieldset(page, "1. NF Validation").locator("input");
    await validacao.nth(0).fill(numero);
    await validacao.nth(1).fill("Fornecedor Teste E2E");
    await validacao.nth(2).fill("07.09.2026");
    // Milhar com ponto + centavos com vírgula — formato BR digitado à mão.
    await validacao.nth(3).fill("1.234,56");

    await fieldset(page, "Conferência de Itens").getByRole("button", { name: "Novo" }).click();
    const itemInputs = fieldset(page, "Conferência de Itens").locator("tbody tr").first().locator("input");
    await itemInputs.nth(1).fill("ITEM-E2E");
    await itemInputs.nth(2).fill("Item de teste E2E");
    await itemInputs.nth(3).fill("10"); // qtd pedida
    await itemInputs.nth(4).fill("8"); // qtd recebida — divergência proposital
    await itemInputs.nth(5).fill("UN");

    const baixa = fieldset(page, "Baixa em Estoque");
    await baixa.locator("select").selectOption("D01");
    await baixa.locator("input").fill("Lote Teste E2E");

    await page.getByTitle("Salvar").click();
    await expect(page).toHaveURL(/\/sucesso\?sessaoId=/, { timeout: 15_000 });

    const usuarioAtualizado = await buscarUltimaSessao(usuario.id);
    expect(usuarioAtualizado?.timestampFim).not.toBeNull();

    const nf = await buscarNotaFiscalPorNumero(numero);
    expect(nf).not.toBeNull();
    expect(nf.valorTotal).toBe(1234.56);
    const lancamento = await buscarLancamentoPorNf(nf.id);
    expect(lancamento?.status).toBe("CONCLUIDO_COM_DIVERGENCIA");
  });
});

test.describe("Cenário A — instrumentação de erros", () => {
  test("CLIQUE_FORA_FLUXO ao clicar em item de menu decorativo", async ({ page }) => {
    const usuario = await entrarNoCenarioA(page, "A-CLIQUE");
    await page.getByRole("button", { name: "Menu", exact: true }).click();

    await expect
      .poll(async () => {
        const sessao = await buscarUltimaSessao(usuario.id);
        const eventos = await buscarEventosErro(sessao.id);
        return eventos.some((e) => e.tipo === "CLIQUE_FORA_FLUXO" && e.detalhe?.includes("menu.Menu"));
      })
      .toBe(true);
  });

  test("INPUT_OBRIGATORIO_VAZIO ao salvar com campos obrigatórios vazios", async ({ page }) => {
    const usuario = await entrarNoCenarioA(page, "A-VAZIO");
    await page.getByTitle("Salvar").click();

    await expect
      .poll(async () => {
        const sessao = await buscarUltimaSessao(usuario.id);
        const eventos = await buscarEventosErro(sessao.id);
        return eventos.some((e) => e.tipo === "INPUT_OBRIGATORIO_VAZIO");
      })
      .toBe(true);
  });

  test("ERRO_VALIDACAO_CAMPO ao informar Número da NF com letras", async ({ page }) => {
    const usuario = await entrarNoCenarioA(page, "A-INVAL");
    const validacao = fieldset(page, "1. NF Validation").locator("input");
    await validacao.nth(0).fill("ABC123");
    await page.getByTitle("Salvar").click();

    await expect
      .poll(async () => {
        const sessao = await buscarUltimaSessao(usuario.id);
        const eventos = await buscarEventosErro(sessao.id);
        return eventos.some((e) => e.tipo === "ERRO_VALIDACAO_CAMPO");
      })
      .toBe(true);
  });

  test("ERRO_LOGICO_CADASTRO ao digitar o código do depósito no campo Lote", async ({ page }) => {
    const usuario = await entrarNoCenarioA(page, "A-TROCA");
    // Dep. Destino é um select (só aceita depósito existente), então a troca
    // de campos aparece como: depósito sem selecionar + código no Lote.
    await fieldset(page, "Baixa em Estoque").locator("input").fill("D01");
    await page.getByTitle("Salvar").click();

    await expect
      .poll(async () => {
        const sessao = await buscarUltimaSessao(usuario.id);
        const eventos = await buscarEventosErro(sessao.id);
        return eventos.some((e) => e.tipo === "ERRO_LOGICO_CADASTRO" && e.detalhe?.includes('lote="D01"'));
      })
      .toBe(true);
  });
});

test.describe("Cenário A — campos de entrada", () => {
  test("Valor Total e Data Emissão aplicam máscara enquanto o usuário digita", async ({ page }) => {
    await entrarNoCenarioA(page, "A-MASCARA");
    const validacao = fieldset(page, "1. NF Validation").locator("input");

    await validacao.nth(2).pressSequentially("07092026");
    await expect(validacao.nth(2)).toHaveValue("07.09.2026");

    await validacao.nth(3).pressSequentially("123456789");
    await expect(validacao.nth(3)).toHaveValue("1.234.567,89");
  });

  test("Dep. Destino só aceita depósitos existentes e não há botão Execute", async ({ page }) => {
    await entrarNoCenarioA(page, "A-DEPOSITO");
    const select = fieldset(page, "Baixa em Estoque").locator("select");

    // type-ahead nativo do select: digitar o início do rótulo seleciona a opção
    await select.focus();
    await page.keyboard.type("D03");
    await expect(select).toHaveValue("D03");
    await expect(select.locator("option")).toHaveText([
      "Selecione...",
      "D01 - Depósito Central",
      "D02 - Depósito Filial Norte",
      "D03 - Depósito Filial Sul",
    ]);

    await expect(page.getByRole("button", { name: "Execute" })).toHaveCount(0);
  });
});
