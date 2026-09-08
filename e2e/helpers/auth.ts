import type { Page } from "@playwright/test";

export async function login(page: Page, codigo: string, senha: string) {
  await page.goto("/");
  await page.getByPlaceholder("Ex: PJS-01").fill(codigo);
  await page.locator('input[type="password"]').fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
}

export async function iniciarTarefa(
  page: Page,
  opts: { perfil: "TECNICO" | "NAO_TECNICO"; cenario: "A" | "B"; conjunto: "conjunto-1" | "conjunto-2" },
) {
  await page.getByText(/^Logado como/).waitFor();
  await page.locator("select").nth(0).selectOption(opts.perfil);
  const selectCenario = page.locator("select").nth(1);
  const selectConjunto = page.locator("select").nth(2);
  // Selects já podem vir travados (regra de não-repetição) — só seleciona
  // manualmente se ainda estiverem habilitados.
  if (await selectCenario.isEnabled()) await selectCenario.selectOption(opts.cenario);
  if (await selectConjunto.isEnabled()) await selectConjunto.selectOption(opts.conjunto);
  await page.getByRole("button", { name: "Iniciar Tarefa" }).click();
}
