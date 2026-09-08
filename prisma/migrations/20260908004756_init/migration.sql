-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('TECNICO', 'NAO_TECNICO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaFiscal" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "dataEmissao" TIMESTAMP(3) NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotaFiscal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemRecebido" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "qtdPedida" DOUBLE PRECISION NOT NULL,
    "qtdRecebida" DOUBLE PRECISION NOT NULL,
    "unidade" TEXT NOT NULL,
    "notaFiscalId" TEXT NOT NULL,

    CONSTRAINT "ItemRecebido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LancamentoEstoque" (
    "id" TEXT NOT NULL,
    "armazem" TEXT NOT NULL,
    "lote" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "notaFiscalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LancamentoEstoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessaoTeste" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "perfilUsuario" "PerfilUsuario" NOT NULL,
    "cenario" TEXT NOT NULL,
    "conjuntoTarefa" TEXT NOT NULL,
    "timestampInicio" TIMESTAMP(3) NOT NULL,
    "timestampFim" TIMESTAMP(3),

    CONSTRAINT "SessaoTeste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoErro" (
    "id" TEXT NOT NULL,
    "sessaoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detalhe" TEXT,

    CONSTRAINT "EventoErro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_codigo_key" ON "Usuario"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "NotaFiscal_numero_key" ON "NotaFiscal"("numero");

-- AddForeignKey
ALTER TABLE "ItemRecebido" ADD CONSTRAINT "ItemRecebido_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "NotaFiscal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoEstoque" ADD CONSTRAINT "LancamentoEstoque_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "NotaFiscal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoTeste" ADD CONSTRAINT "SessaoTeste_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoErro" ADD CONSTRAINT "EventoErro_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "SessaoTeste"("id") ON DELETE CASCADE ON UPDATE CASCADE;
