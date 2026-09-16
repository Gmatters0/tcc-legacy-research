-- AlterTable
-- Coluna adicionada nullable e preenchida por UPDATE antes de virar NOT NULL,
-- porque a tabela já tem linhas (dado de teste/piloto) — backfill recalcula
-- tlxScore como a média das 6 dimensões já gravadas, mesma fórmula de
-- calcularTlxScore() em lib/avaliacao-config.ts.
ALTER TABLE "AvaliacaoPosTarefa" ADD COLUMN     "tlxScore" DOUBLE PRECISION;

UPDATE "AvaliacaoPosTarefa"
SET "tlxScore" = ("tlxMental" + "tlxFisica" + "tlxTemporal" + "tlxDesempenho" + "tlxEsforco" + "tlxFrustracao") / 6.0;

ALTER TABLE "AvaliacaoPosTarefa" ALTER COLUMN "tlxScore" SET NOT NULL;
