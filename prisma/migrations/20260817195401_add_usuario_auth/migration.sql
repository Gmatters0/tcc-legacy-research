/*
  Warnings:

  - You are about to drop the column `participanteId` on the `SessaoTeste` table. All the data in the column will be lost.
  - Added the required column `usuarioId` to the `SessaoTeste` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SessaoTeste" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "perfilUsuario" TEXT NOT NULL,
    "cenario" TEXT NOT NULL,
    "conjuntoTarefa" TEXT NOT NULL,
    "timestampInicio" DATETIME NOT NULL,
    "timestampFim" DATETIME,
    CONSTRAINT "SessaoTeste_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SessaoTeste" ("cenario", "conjuntoTarefa", "id", "perfilUsuario", "timestampFim", "timestampInicio") SELECT "cenario", "conjuntoTarefa", "id", "perfilUsuario", "timestampFim", "timestampInicio" FROM "SessaoTeste";
DROP TABLE "SessaoTeste";
ALTER TABLE "new_SessaoTeste" RENAME TO "SessaoTeste";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_codigo_key" ON "Usuario"("codigo");
