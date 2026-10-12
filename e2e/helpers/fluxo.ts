import type { Page } from "@playwright/test";

function fieldsetA(page: Page, texto: string) {
  return page.locator("fieldset").filter({ hasText: texto });
}

export async function completarCenarioA(page: Page, numero: string) {
  const validacao = fieldsetA(page, "1. NF Validation").locator("input");
  await validacao.nth(0).fill(numero);
  await validacao.nth(1).fill("Fornecedor Teste E2E");
  await validacao.nth(2).fill("07.09.2026");
  await validacao.nth(3).fill("1000,00");

  await fieldsetA(page, "Conferência de Itens").getByRole("button", { name: "Novo" }).click();
  const itemInputs = fieldsetA(page, "Conferência de Itens").locator("tbody tr").first().locator("input");
  await itemInputs.nth(1).fill("ITEM-E2E");
  await itemInputs.nth(2).fill("Item de teste E2E");
  await itemInputs.nth(3).fill("10");
  await itemInputs.nth(4).fill("10");
  await itemInputs.nth(5).fill("UN");

  const baixa = fieldsetA(page, "Baixa em Estoque");
  await baixa.locator("select").selectOption("D01");
  await baixa.locator("input").fill("Lote Teste E2E");

  await page.getByTitle("Salvar").click();
}

export async function completarCenarioB(page: Page, numero: string) {
  await page.getByPlaceholder("Ex: 4052").fill(numero);
  await page.getByPlaceholder("Ex: TechSupplies Ind. Ltda.").fill("Fornecedor Teste E2E B");
  await page.locator('input[type="date"]').fill("2026-09-07");
  await page.getByPlaceholder("Ex: 12.450,00").fill("500,00");
  await page.getByRole("button", { name: "Próximo →" }).click();

  await page.getByRole("button", { name: "Adicionar Item" }).click();
  await page.getByPlaceholder("Ex: ITM-00124").fill("ITEM-E2E-B");
  await page.getByPlaceholder("Descrição do item").fill("Item de teste E2E");
  await page.locator('input[type="number"]').nth(0).fill("6");
  await page.locator('input[type="number"]').nth(1).fill("6");
  await page.getByPlaceholder("UN").fill("UN");
  await page.getByRole("button", { name: "Próximo →" }).click();

  await page.locator("select").first().selectOption({ label: "D02 - Depósito Filial Norte" });
  await page.getByPlaceholder("Ex: Lote de Estoque A").fill("Lote Teste E2E B");
  await page.getByRole("button", { name: "Salvar Lançamento" }).click();
}

// Preenche um grupo de escalas Likert (radios ocultos via sr-only, clicados
// com force pra ignorar a checagem de visibilidade) — usado pelo SUS e pelo
// questionário subjetivo, ambos 10 itens de 5 opções.
async function preencherLikert(page: Page, grupos: number, valor: number) {
  const radios = page.locator('input[type="radio"]');
  for (let g = 0; g < grupos; g++) {
    await radios.nth(g * 5 + (valor - 1)).check({ force: true });
  }
}

// Completa a avaliação pós-tarefa (NASA-TLX → SUS → subjetivo) que aparece
// automaticamente em /sucesso ao final de cada cenário. Assume que a página
// já está no Passo 1 (TLX).
export async function completarAvaliacaoPosTarefa(page: Page) {
  const sliders = page.locator('input[type="range"]');
  const valoresTlx = ["30", "10", "40", "20", "35", "15"];
  for (let i = 0; i < valoresTlx.length; i++) {
    await sliders.nth(i).fill(valoresTlx[i]);
  }
  await page.getByRole("button", { name: "Próximo →" }).click();

  await preencherLikert(page, 10, 4);
  await page.getByRole("button", { name: "Próximo →" }).click();

  await preencherLikert(page, 10, 3);
  await page.getByRole("button", { name: "Enviar avaliação" }).click();
}

// Completa a comparação final (só aparece depois do segundo cenário +
// avaliação) e conclui a participação.
export async function completarComparacaoFinal(page: Page, preferencia: "A" | "B") {
  await page.locator(`input[type="radio"][value="${preferencia}"]`).check({ force: true });
  await page.getByPlaceholder("O que pesou na sua preferência?").fill("Motivo de teste E2E.");
  await page.getByRole("button", { name: "Enviar e concluir participação" }).click();
}
