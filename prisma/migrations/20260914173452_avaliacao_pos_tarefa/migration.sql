-- CreateTable
CREATE TABLE "AvaliacaoPosTarefa" (
    "id" TEXT NOT NULL,
    "sessaoId" TEXT NOT NULL,
    "tlxMental" DOUBLE PRECISION NOT NULL,
    "tlxFisica" DOUBLE PRECISION NOT NULL,
    "tlxTemporal" DOUBLE PRECISION NOT NULL,
    "tlxDesempenho" DOUBLE PRECISION NOT NULL,
    "tlxEsforco" DOUBLE PRECISION NOT NULL,
    "tlxFrustracao" DOUBLE PRECISION NOT NULL,
    "susQ1" INTEGER NOT NULL,
    "susQ2" INTEGER NOT NULL,
    "susQ3" INTEGER NOT NULL,
    "susQ4" INTEGER NOT NULL,
    "susQ5" INTEGER NOT NULL,
    "susQ6" INTEGER NOT NULL,
    "susQ7" INTEGER NOT NULL,
    "susQ8" INTEGER NOT NULL,
    "susQ9" INTEGER NOT NULL,
    "susQ10" INTEGER NOT NULL,
    "susScore" DOUBLE PRECISION NOT NULL,
    "subjQ1" INTEGER NOT NULL,
    "subjQ2" INTEGER NOT NULL,
    "subjQ3" INTEGER NOT NULL,
    "subjQ4" INTEGER NOT NULL,
    "subjQ5" INTEGER NOT NULL,
    "subjQ6" INTEGER NOT NULL,
    "subjQ7" INTEGER NOT NULL,
    "subjQ8" INTEGER NOT NULL,
    "subjQ9" INTEGER NOT NULL,
    "subjQ10" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvaliacaoPosTarefa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComparacaoFinal" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "preferencia" TEXT NOT NULL,
    "porque" TEXT NOT NULL,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComparacaoFinal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvaliacaoPosTarefa_sessaoId_key" ON "AvaliacaoPosTarefa"("sessaoId");

-- CreateIndex
CREATE UNIQUE INDEX "ComparacaoFinal_usuarioId_key" ON "ComparacaoFinal"("usuarioId");

-- AddForeignKey
ALTER TABLE "AvaliacaoPosTarefa" ADD CONSTRAINT "AvaliacaoPosTarefa_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "SessaoTeste"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparacaoFinal" ADD CONSTRAINT "ComparacaoFinal_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
