@AGENTS.md

# TCC — Pesquisa de Usabilidade: ERP Legado vs. ERP Moderno

## Contexto, Objetivo e Motivação

Este projeto é o setup técnico de um Trabalho de Conclusão de Curso (TCC) que investiga,
empiricamente, o impacto do design de interface na usabilidade de sistemas ERP. A pesquisa
compara duas interfaces para o **mesmo fluxo de negócio**:

- **Cenário A (Legado)** — interface densa, no padrão SAP GUI / TOTVS Protheus: menu de
  transação, toolbar com ícones, tela única com todos os campos visíveis, sem validação em
  tempo real, rodapé com teclas de função.
- **Cenário B (Moderno)** — wizard de 3 passos aplicando heurísticas de Nielsen: validação em
  tempo real, feedback visual imediato, navegação guiada, prevenção de erro por design (ex:
  campos com opções fixas em vez de texto livre onde faz sentido).

O fluxo testado é: **Recebimento de Nota Fiscal → Conferência de Itens → Baixa em Estoque**.

O experimento mede **Time-on-Task** (tempo para concluir a tarefa) e **Taxa de Erros** (por
tipo) em cada cenário, para cada participante, permitindo comparar objetivamente qual
abordagem de design produz melhor desempenho e menos erros do usuário.

### Regra metodológica inegociável

Os dois cenários **compartilham 100% da mesma lógica de negócio, API e banco de dados** —
divergindo **exclusivamente** na camada visual/front-end. Qualquer diferença de comportamento
entre A e B fora da UI invalidaria o experimento cientificamente. Nenhum componente de tela
(`/app/cenario-a`, `/app/cenario-b`) importa lógica de negócio diretamente — ambos só chamam
os mesmos endpoints de `/app/api/**`, que por sua vez só importam de `/lib/business-logic` e
`/lib/prisma`. Diferenças de **padrão de interação** (ex: Cenário A validar só no submit,
Cenário B validar em tempo real; Cenário B usar `<select>` de armazém enquanto A usa texto
livre + modal de busca) são intencionais e fazem parte do que está sendo medido — não violam
a regra, pois a lógica e os dados por trás continuam idênticos.

## Stack Técnica

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **Prisma 7** + **SQLite**, via driver adapter `@prisma/adapter-better-sqlite3` (Prisma 7 não
  aceita mais conexão direta por `DATABASE_URL` sem adapter)
- **lucide-react** para ícones (fidelidade visual próxima ao Figma sem custo de export de assets)
- **pnpm** como gerenciador de pacotes (`packageManager: "pnpm@10.33.0"` fixado no
  `package.json`) — **não usar `npm`**. Módulos nativos (`better-sqlite3`, engines do Prisma)
  exigem aprovação de build scripts do pnpm, já configurada em `package.json` →
  `pnpm.onlyBuiltDependencies`.

## Scripts de Execução

Todos via `pnpm` (nunca `npm`):

| Comando | Efeito |
|---|---|
| `pnpm install` | Instala dependências (roda build scripts aprovados automaticamente) |
| `pnpm run dev` | Sobe o servidor de desenvolvimento em `http://localhost:3000` |
| `pnpm run build` | Build de produção |
| `pnpm run start` | Roda o build de produção |
| `pnpm run lint` | ESLint (ignora `scripts/**`, que são CLIs CommonJS fora do app) |
| `pnpm exec tsc --noEmit` | Checagem de tipos sem gerar arquivos |
| `pnpm exec prisma migrate dev --name <nome>` | Cria e aplica uma nova migration |
| `pnpm exec prisma generate` | Regenera o Prisma Client (`app/generated/prisma`) |
| `pnpm exec prisma studio` | Abre GUI local para inspecionar o banco |
| `pnpm run db:reset` | **Zera o banco de dados** (pede confirmação `CONFIRMAR`) |
| `pnpm run db:reset -- --yes` | Zera o banco sem prompt (automação) |

**Antes de qualquer coleta de dados real com participantes, rode `pnpm run db:reset`** para
garantir que a base começa vazia — o script apaga `EventoErro`, `ItemRecebido`,
`LancamentoEstoque`, `NotaFiscal` e `SessaoTeste`, nessa ordem (respeita FKs), e mostra a
contagem antes/depois. Ver `scripts/reset-db.js`.

O banco vive em `dev.db` (raiz do projeto, SQLite, gitignored — `DATABASE_URL="file:./dev.db"`
em `.env`). Tudo roda localmente: o mesmo processo Next.js serve as páginas e as API Routes,
sem backend separado.

## Estrutura de Pastas

```
/app
  page.tsx                          → home (bootstrap de sessão: código do participante,
                                       perfil, cenário, conjunto de tarefa → "Iniciar Tarefa")
  /api
    /notas-fiscais
      route.ts                      → POST cria NF
      /[id]/route.ts                 → GET NF completa (itens + lançamentos)
      /[id]/itens/route.ts           → POST registra conferência (substitui itens da NF)
      /[id]/baixa/route.ts           → POST registra baixa em estoque
    /sessoes
      route.ts                      → POST cria SessaoTeste + limpa sessões abandonadas
      /[id]/route.ts                 → PATCH finaliza SessaoTeste (timestampFim)
      /[id]/abandonar/route.ts       → POST remove SessaoTeste não finalizada (via beacon)
    /eventos-erro/route.ts          → POST registra EventoErro
  /cenario-a                        → tela única densa (client component)
    CenarioAApp.tsx                 → orquestrador: estado, submit em lote, modais
    /components                     → TopNavBar, FooterFKeys, FieldsetValidacao,
                                       FieldsetConferencia, FieldsetBaixa, ErrorReviewModal,
                                       DepositoModal
  /cenario-b                        → wizard de 3 passos, rota única, estado client-side
    CenarioBApp.tsx                 → orquestrador: passoAtual, maiorPassoAlcancado
    /components                     → TopAppBar, SideNavBar, Stepper, PassoValidacao,
                                       PassoConferencia, PassoBaixa
/lib
  prisma.ts                         → singleton do PrismaClient (com driver adapter)
  task-config.ts                    → CENARIOS, CONJUNTOS_TAREFA, PERFIS_USUARIO,
                                       ARMAZENS_DISPONIVEIS (compartilhado entre A e B)
  api-response.ts                   → helper de resposta de erro estruturado da API
  /business-logic                   → única fonte de regras de negócio (ver seção abaixo)
    types.ts, notaFiscal.ts, conferencia.ts, estoque.ts
  /instrumentation                  → única fonte de instrumentação de métricas
    types.ts                        → enum TipoEventoErro, tipos de sessão
    session.ts                      → criarSessao(), finalizarSessao()
    erros.ts                        → registrarErro(), classificarTipoErroPorMensagem()
    heuristica.ts                   → pareceCampoTrocado() (heurística de ERRO_LOGICO_CADASTRO)
    SessaoProvider.tsx              → contexto React: sessaoId, registrarErro, finalizarSessao,
                                       limpeza via `pagehide` + sendBeacon
/prisma
  schema.prisma
  /migrations
/scripts
  reset-db.js                       → zera o banco (ver Scripts de Execução acima)
```

## Modelo de Dados (`prisma/schema.prisma`)

```prisma
enum PerfilUsuario {
  TECNICO
  NAO_TECNICO
}

model NotaFiscal {
  id                 String   @id @default(cuid())
  numero             String   @unique
  fornecedor         String
  dataEmissao        DateTime
  valorTotal         Float
  createdAt          DateTime @default(now())
  itensRecebidos     ItemRecebido[]
  lancamentosEstoque LancamentoEstoque[]
}

model ItemRecebido {
  id           String @id @default(cuid())
  codigo       String
  descricao    String
  qtdPedida    Float
  qtdRecebida  Float
  unidade      String
  notaFiscalId String
  notaFiscal   NotaFiscal @relation(fields: [notaFiscalId], references: [id])
}

model LancamentoEstoque {
  id           String   @id @default(cuid())
  armazem      String
  lote         String
  quantidade   Float
  status       String    // "CONCLUIDO" | "CONCLUIDO_COM_DIVERGENCIA"
  notaFiscalId String
  notaFiscal   NotaFiscal @relation(fields: [notaFiscalId], references: [id])
  createdAt    DateTime @default(now())
}

model SessaoTeste {
  id              String        @id @default(cuid())
  participanteId  String        // código do moderador (ex: "P01") — NUNCA o nome real
  perfilUsuario   PerfilUsuario
  cenario         String        // "A" | "B"
  conjuntoTarefa  String
  timestampInicio DateTime
  timestampFim    DateTime?
  eventosErro     EventoErro[]
}

model EventoErro {
  id        String      @id @default(cuid())
  sessaoId  String
  sessao    SessaoTeste @relation(fields: [sessaoId], references: [id], onDelete: Cascade)
  tipo      String
  timestamp DateTime    @default(now())
  detalhe   String?
}
```

**Privacidade**: `participanteId` guarda só um código atribuído pelo moderador — identificação
real (para TCLE) fica em registro físico/separado, nunca no banco.

## Fluxo de Negócio → API (idêntico nos dois cenários)

1. **Recebimento** — `POST /api/notas-fiscais` cria a `NotaFiscal`.
2. **Conferência** — `POST /api/notas-fiscais/[id]/itens` recebe a lista de itens **inseridos
   manualmente pelo usuário** (código, descrição, qtd. pedida, qtd. recebida, unidade — não há
   pré-preenchimento) e calcula divergência por item (`qtdRecebida ≠ qtdPedida`).
3. **Baixa** — `POST /api/notas-fiscais/[id]/baixa` cria o `LancamentoEstoque`, com `status`
   derivado da divergência calculada no passo anterior.

Toda resposta de erro da API segue o formato `{ erros: [{ campo, mensagem }] }` — nunca grava
parcialmente.

## Regras de Negócio (validação server-side — única fonte, `lib/business-logic/`)

| Campo | Regra |
|---|---|
| `NotaFiscal.numero` | obrigatório, único, **apenas dígitos** (`/^\d+$/`) |
| `NotaFiscal.fornecedor` | obrigatório, **qualquer caractere aceito** |
| `NotaFiscal.dataEmissao` | obrigatória, data válida |
| `NotaFiscal.valorTotal` | obrigatório, numérico, **pode ser zero** (ex: item recebido como brinde/permuta), não pode ser negativo |
| `ItemRecebido.codigo/descricao/unidade` | obrigatórios |
| `ItemRecebido.qtdPedida` | obrigatória, **deve ser > 0** (zero e negativo bloqueados) |
| `ItemRecebido.qtdRecebida` | obrigatória, **deve ser > 0** (zero e negativo bloqueados) |
| `LancamentoEstoque.armazem` | obrigatório, texto livre (não validado quanto ao conteúdo) |
| `LancamentoEstoque.lote` | obrigatório, texto livre — divergências só detectáveis via análise do banco, **nunca bloqueadas** |
| `LancamentoEstoque.quantidade` | obrigatória, **deve ser > 0** (zero e negativo bloqueados) |
| Baixa sem conferência prévia | bloqueada |

**Padrão vazio-vs-zero**: no client (ambos os cenários), quantidades ficam como *texto* no
estado da UI até o submit, convertidas para `undefined` se vazias (nunca coagidas a `0`) — só
assim a distinção entre "campo vazio" (`INPUT_OBRIGATORIO_VAZIO`) e "campo preenchido com
zero" (`ERRO_VALIDACAO_CAMPO`) chega intacta na API.

**Divergência**: `qtdRecebida - qtdPedida ≠ 0` por item → nota divergente →
`LancamentoEstoque.status = "CONCLUIDO_COM_DIVERGENCIA"`; caso contrário, `"CONCLUIDO"`.

## Instrumentação de Métricas

### Time-on-Task

- `timestampInicio` gravado no clique em **"Iniciar Tarefa"** na home (`POST /api/sessoes`).
- `timestampFim` só é gravado no **sucesso** da Baixa em Estoque — nunca antes, nunca em erro.
- **Sessões abandonadas nunca persistem no banco**: `SessaoProvider` registra um listener de
  `pagehide` que dispara `navigator.sendBeacon` para `POST /api/sessoes/[id]/abandonar`
  (apaga a sessão só se `timestampFim` ainda for nulo). Como rede de segurança, `POST
  /api/sessoes` também limpa qualquer `SessaoTeste` com `timestampFim` nulo antes de criar
  uma nova (cobre casos em que o beacon não disparou — crash, processo morto).
  `EventoErro.sessao` tem `onDelete: Cascade`, então os eventos órfãos somem junto.

### Taxa de Erros — 4 tipos (`TipoEventoErro`, `lib/instrumentation/types.ts`)

**`CLIQUE_FORA_FLUXO`** — clique em elemento decorativo/não funcional, ou navegação fora de
ordem. Todo elemento decorativo tem handler (`registrarErro('CLIQUE_FORA_FLUXO', 'elemento:
<id>')`), sem executar nenhuma outra ação — nenhum clique morto.
- **Cenário A**: itens do menu (Menu/Edit/Favorites/Extras/System/Help), ícones da toolbar
  (busca+seta do ENT_NF, Imprimir, Voltar, Topo, Ajuda, Execute), teclas de função do rodapé
  (F3/F5/F7/F12 — **F2 é funcional**, aciona o salvamento real), botão "Pesquisar" da
  Conferência.
- **Cenário B**: itens do SideNavBar, ícones do TopAppBar (sino, engrenagem, apps), nav
  Home/Analytics/Audit, avatar, clique no Stepper em passo **ainda não alcançado**.
- **Stepper (B)**: navegação livre (sem log) para qualquer passo já alcançado, para frente ou
  para trás — só bloqueia (e loga) pular além do maior passo alcançado, pois passo 2 exige NF
  criada e passo 3 exige conferência concluída.

**`INPUT_OBRIGATORIO_VAZIO`** — campo obrigatório vazio.
- Cenário B: tempo real (blur/submit), antes de qualquer chamada à API.
- Cenário A: só depois da resposta da API no submit final (sem validação em tempo real, por
  design — fidelidade ao legado).

**`ERRO_VALIDACAO_CAMPO`** — campo preenchido em formato/valor inválido (número não numérico,
negativo, zero onde exige `>0`, número da NF com letras, NF duplicada, etc). **Toda** resposta
de erro estruturado da API é lida por completo — cada item de `erros[]` vira um
`registrarErro()`, nada é mostrado ao usuário sem também virar linha em `EventoErro`
(`classificarTipoErroPorMensagem`, único helper usado pelos dois cenários: mensagem contendo
"obrigat" → `INPUT_OBRIGATORIO_VAZIO`, senão → `ERRO_VALIDACAO_CAMPO`).

**`ERRO_LOGICO_CADASTRO`** — dado tecnicamente aceito mas semanticamente incoerente (sistema
não bloqueia, só sinaliza). Único ponto implementado hoje: `pareceCampoTrocado`
(`lib/instrumentation/heuristica.ts`) detecta, no **Cenário A**, quando "Dep. Destino" não
parece um código de armazém mas "Lote" parece — sinal de campos trocados. **Não existe
detecção equivalente no Cenário B** — lá "Dep. Destino" é um `<select>` de opções fixas
(prevenção de erro por design, não uma lacuna), então esse tipo de erro específico não pode
acontecer ali. Ver "O que ainda falta" abaixo.

## Design de Referência (Figma)

Arquivo: **TCC 2 - ERP** — `fileKey KsYffsjp19qRrqxS44UGlr`
<https://www.figma.com/design/KsYffsjp19qRrqxS44UGlr/TCC-2---ERP>

| Tela | Node | Link |
|---|---|---|
| Cenário B — Passo 1: Validação | `1:9` | <https://www.figma.com/design/KsYffsjp19qRrqxS44UGlr/TCC-2---ERP?node-id=1-9> |
| Cenário B — Passo 2: Conferência | `1:169` | <https://www.figma.com/design/KsYffsjp19qRrqxS44UGlr/TCC-2---ERP?node-id=1-169> |
| Cenário B — Passo 3: Baixa | `1:399` | <https://www.figma.com/design/KsYffsjp19qRrqxS44UGlr/TCC-2---ERP?node-id=1-399> |
| Cenário A — Tela única (legado) | `1:623` | <https://www.figma.com/design/KsYffsjp19qRrqxS44UGlr/TCC-2---ERP?node-id=1-623> |

As telas foram implementadas a partir do design extraído desses nós via MCP do Figma
(`get_design_context`/`get_metadata`). As cores, espaçamentos e tipografia foram lidos
diretamente do design retornado e aplicados como classes arbitrárias do Tailwind em cada
componente (ex: `text-[#004ac6]`, `border-[#c3c6d7]`) — **não há um arquivo central de design
tokens/variáveis no código**; qualquer ajuste visual deve ser feito componente a componente,
comparando com o frame correspondente no Figma acima. Ícones foram substituídos por
equivalentes do `lucide-react` (decisão registrada: fidelidade visual próxima, sem custo de
export de assets).

## O que já foi implementado

- Scaffold completo (Next.js + TS + Tailwind v4 + Prisma 7/SQLite + pnpm).
- Schema de dados completo (5 models + enum), migrations aplicadas.
- Camada de lógica de negócio compartilhada (`lib/business-logic`) com todas as regras de
  validação da seção acima.
- API compartilhada completa (`/api/notas-fiscais`, `/api/sessoes`, `/api/eventos-erro` e
  subrotas), usada identicamente pelos dois cenários.
- Instrumentação completa: cronômetro (início/fim), os 4 tipos de `EventoErro`, limpeza de
  sessões abandonadas (beacon + rede de segurança server-side).
- Home page com bootstrap de sessão (código do participante, perfil, cenário, conjunto de
  tarefa).
- Cenário A completo: tela densa, TopNavBar, FooterFKeys (F2 funcional), 3 seções com
  inserção manual de itens, modal de seleção de depósito, fluxo de erro em 2 modais
  (confirmar → log completo).
- Cenário B completo: wizard de 3 passos navegável via Stepper, validação em tempo real,
  inserção/remoção manual de itens, `<select>` de depósito.
- Todos os elementos decorativos de ambos os cenários instrumentados com `CLIQUE_FORA_FLUXO`
  (sem cliques mortos).
- Migração de `npm` para `pnpm`; script `pnpm run db:reset` para zerar o banco antes da coleta
  real.
- Verificação funcional completa (type-check, lint e fluxo ponta a ponta) rodada ao vivo em
  ambos os cenários após cada rodada de mudanças.

## O que ainda falta implementar (fora de escopo até agora)

Itens explicitamente adiados desde o pedido original, ainda não implementados:

- **Exportação de dados** para análise estatística (hoje só é possível consultar o SQLite
  diretamente ou via `prisma studio`).
- **Autenticação de usuário** (a home hoje não tem controle de acesso — qualquer pessoa com
  o link pode iniciar uma sessão).
- **Carregamento real dos conjuntos de tarefas de teste**: `CONJUNTOS_TAREFA` em
  `lib/task-config.ts` é hoje só uma lista fixa de rótulos ("Conjunto de Tarefas 1/2") — o
  conteúdo/instruções de cada conjunto de tarefa ainda não existe e precisa entrar via
  seed/fixture.

Lacuna identificada na auditoria de instrumentação e ainda sem decisão do pesquisador:

- **`ERRO_LOGICO_CADASTRO` no Cenário B**: não há nenhum ponto de disparo hoje (só existe a
  heurística de armazém/lote trocados, exclusiva do Cenário A). Fica em aberto se vale a pena
  adicionar uma heurística equivalente para Número da NF / Fornecedor trocados (ambos texto
  livre, nos dois cenários) para dar cobertura desse tipo de erro também em B.

Limitação conhecida, não corrigida por ser considerada fora do escopo atual:

- Navegar de volta a um passo já preenchido (via "Anterior" ou pelo Stepper, no Cenário B, ou
  reload de página) não restaura os dados já digitados — o formulário volta em branco, embora
  a `NotaFiscal` já criada continue no banco. Resubmeter o Passo 1 com o mesmo número de NF
  gera erro de duplicidade (comportamento correto da regra de negócio, mas pode confundir
  durante testes manuais).
