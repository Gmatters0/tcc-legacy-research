import { expect, test, type Page } from "@playwright/test";
import {
  buscarEventosErro,
  buscarLancamentoPorNf,
  buscarNotaFiscalPorNumero,
  buscarUltimaSessao,
  criarUsuarioTeste,
  gerarNumeroNfTeste,
} from "./helpers/db";
import { iniciarTarefa, login } from "./helpers/auth";

async function entrarNoCenarioB(page: Page, rotulo: string, conjunto: "conjunto-1" | "conjunto-2" = "conjunto-1") {
  const usuario = await criarUsuarioTeste(rotulo);
  await login(page, usuario.codigo, usuario.senha);
  await iniciarTarefa(page, { perfil: "NAO_TECNICO", cenario: "B", conjunto });
  await expect(page.getByRole("heading", { name: "Validação da Nota Fiscal" })).toBeVisible();
  return usuario;
}

async function preencherPasso1(page: Page, opts: { numero: string; fornecedor: string; valorTotal: string }) {
  await page.getByPlaceholder("Ex: 4052").fill(opts.numero);
  await page.getByPlaceholder("Ex: TechSupplies Ind. Ltda.").fill(opts.fornecedor);
  await page.locator('input[type="date"]').fill("2026-09-07");
  await page.getByPlaceholder("Ex: 12.450,00").fill(opts.valorTotal);
}

test.describe("Cenário B — fluxo de sucesso", () => {
  test("completa a tarefa sem divergência e chega em /sucesso", async ({ page }) => {
    const usuario = await entrarNoCenarioB(page, "B-SUCESSO");
    const numero = gerarNumeroNfTeste();

    await preencherPasso1(page, { numero, fornecedor: "Fornecedor Teste E2E", valorTotal: "500,00" });
    await page.getByRole("button", { name: "Próximo →" }).click();

    await expect(page.getByRole("heading", { name: "Itens da Nota" })).toBeVisible();
    await page.getByRole("button", { name: "Adicionar Item" }).click();
    await page.getByPlaceholder("Ex: ITM-00124").fill("ITEM-E2E-B");
    await page.getByPlaceholder("Descrição do item").fill("Item de teste E2E");
    await page.locator('input[type="number"]').nth(0).fill("6");
    await page.locator('input[type="number"]').nth(1).fill("6");
    await page.getByPlaceholder("UN").fill("UN");
    await page.getByRole("button", { name: "Próximo →" }).click();

    await expect(page.getByRole("heading", { name: "Detalhes do Lançamento" })).toBeVisible();
    await page.locator("select").first().selectOption({ label: "D02 - Depósito Filial Norte" });
    await page.getByPlaceholder("Ex: Lote de Estoque A").fill("Lote Teste E2E B");
    await page.getByRole("button", { name: "Salvar Lançamento" }).click();

    await expect(page).toHaveURL("/sucesso", { timeout: 15_000 });

    const sessao = await buscarUltimaSessao(usuario.id);
    expect(sessao?.timestampFim).not.toBeNull();

    const nf = await buscarNotaFiscalPorNumero(numero);
    const lancamento = await buscarLancamentoPorNf(nf.id);
    expect(lancamento?.status).toBe("CONCLUIDO");
  });
});

test.describe("Cenário B — persistência de navegação", () => {
  test("voltar ao Passo 1 preserva os dados e não recria a NF", async ({ page }) => {
    await entrarNoCenarioB(page, "B-PERSIST");
    const numero = gerarNumeroNfTeste();

    await preencherPasso1(page, { numero, fornecedor: "Fornecedor Persistência", valorTotal: "10,00" });
    await page.getByRole("button", { name: "Próximo →" }).click();
    await expect(page.getByRole("heading", { name: "Itens da Nota" })).toBeVisible();

    await page.getByRole("button", { name: "Adicionar Item" }).click();
    await page.getByPlaceholder("Ex: ITM-00124").fill("ITEM-PERSIST");

    // Volta pro Passo 1 pelo Stepper.
    await page.getByRole("button", { name: /Validação/ }).click();
    const numeroInput = page.getByPlaceholder("Ex: 4052");
    await expect(numeroInput).toHaveValue(numero);
    await expect(numeroInput).toHaveAttribute("readonly", "");
    await expect(page.getByText("já foi registrada")).toBeVisible();

    // "Próximo" aqui não deve reenviar a NF (só navegar) — sem erro de duplicidade.
    await page.getByRole("button", { name: "Próximo →" }).click();
    await expect(page.getByRole("heading", { name: "Itens da Nota" })).toBeVisible();
    await expect(page.getByPlaceholder("Ex: ITM-00124")).toHaveValue("ITEM-PERSIST");
  });
});

test.describe("Cenário B — instrumentação de erros", () => {
  test("CLIQUE_FORA_FLUXO ao clicar em item do menu lateral", async ({ page }) => {
    const usuario = await entrarNoCenarioB(page, "B-CLIQUE");
    await page.getByRole("button", { name: "Dashboard" }).click();

    await expect
      .poll(async () => {
        const sessao = await buscarUltimaSessao(usuario.id);
        const eventos = await buscarEventosErro(sessao.id);
        return eventos.some((e) => e.tipo === "CLIQUE_FORA_FLUXO" && e.detalhe?.includes("sidenav.Dashboard"));
      })
      .toBe(true);
  });

  test("INPUT_OBRIGATORIO_VAZIO ao avançar com campos vazios", async ({ page }) => {
    const usuario = await entrarNoCenarioB(page, "B-VAZIO");
    await page.getByRole("button", { name: "Próximo →" }).click();

    await expect
      .poll(async () => {
        const sessao = await buscarUltimaSessao(usuario.id);
        const eventos = await buscarEventosErro(sessao.id);
        return eventos.some((e) => e.tipo === "INPUT_OBRIGATORIO_VAZIO");
      })
      .toBe(true);
  });

  test("ERRO_VALIDACAO_CAMPO ao informar Número da NF com letras", async ({ page }) => {
    const usuario = await entrarNoCenarioB(page, "B-INVAL");
    await page.getByPlaceholder("Ex: 4052").fill("ABC123");
    await page.getByRole("button", { name: "Próximo →" }).click();

    await expect
      .poll(async () => {
        const sessao = await buscarUltimaSessao(usuario.id);
        const eventos = await buscarEventosErro(sessao.id);
        return eventos.some((e) => e.tipo === "ERRO_VALIDACAO_CAMPO");
      })
      .toBe(true);
  });

  test("ERRO_LOGICO_CADASTRO quando Fornecedor parece um Nº de NF", async ({ page }) => {
    const usuario = await entrarNoCenarioB(page, "B-TROCA");
    const numero = gerarNumeroNfTeste();
    // Precisa de formulário totalmente válido — a heurística só roda depois
    // que as validações de campo já passaram (ver PassoValidacao.tsx).
    await preencherPasso1(page, { numero, fornecedor: "99999999", valorTotal: "10,00" });
    await page.getByRole("button", { name: "Próximo →" }).click();

    await expect
      .poll(async () => {
        const sessao = await buscarUltimaSessao(usuario.id);
        const eventos = await buscarEventosErro(sessao.id);
        return eventos.some((e) => e.tipo === "ERRO_LOGICO_CADASTRO" && e.detalhe?.includes("99999999"));
      })
      .toBe(true);
  });
});
