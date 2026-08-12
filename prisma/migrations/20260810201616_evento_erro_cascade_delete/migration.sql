-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EventoErro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessaoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detalhe" TEXT,
    CONSTRAINT "EventoErro_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "SessaoTeste" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EventoErro" ("detalhe", "id", "sessaoId", "timestamp", "tipo") SELECT "detalhe", "id", "sessaoId", "timestamp", "tipo" FROM "EventoErro";
DROP TABLE "EventoErro";
ALTER TABLE "new_EventoErro" RENAME TO "EventoErro";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
