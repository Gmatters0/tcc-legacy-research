-- CreateTable
CREATE TABLE "NotaFiscal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "dataEmissao" DATETIME NOT NULL,
    "valorTotal" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ItemRecebido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "qtdPedida" REAL NOT NULL,
    "qtdRecebida" REAL NOT NULL,
    "unidade" TEXT NOT NULL,
    "notaFiscalId" TEXT NOT NULL,
    CONSTRAINT "ItemRecebido_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "NotaFiscal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LancamentoEstoque" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "armazem" TEXT NOT NULL,
    "lote" TEXT NOT NULL,
    "quantidade" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "notaFiscalId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LancamentoEstoque_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "NotaFiscal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessaoTeste" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participanteId" TEXT NOT NULL,
    "perfilUsuario" TEXT NOT NULL,
    "cenario" TEXT NOT NULL,
    "conjuntoTarefa" TEXT NOT NULL,
    "timestampInicio" DATETIME NOT NULL,
    "timestampFim" DATETIME
);

-- CreateTable
CREATE TABLE "EventoErro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessaoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detalhe" TEXT,
    CONSTRAINT "EventoErro_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "SessaoTeste" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "NotaFiscal_numero_key" ON "NotaFiscal"("numero");
