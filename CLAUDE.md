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
| `pnpm test` | Roda a suíte de testes automatizados (Vitest, ver seção "Testes Automatizados") |

**Antes de qualquer coleta de dados real com participantes, rode `pnpm run db:reset`** para
garantir que a base começa vazia — o script apaga `EventoErro`, `ItemRecebido`,
`LancamentoEstoque`, `NotaFiscal` e `SessaoTeste`, nessa ordem (respeita FKs), e mostra a
contagem antes/depois. Ver `scripts/reset-db.js`.

O banco vive em `dev.db` (raiz do projeto, SQLite, gitignored — `DATABASE_URL="file:./dev.db"`
em `.env`). Tudo roda localmente: o mesmo processo Next.js serve as páginas e as API Routes,
sem backend separado. `.env` também guarda `ADMIN_SENHA` (senha única do painel `/admin` — ver
seção "Painel Administrativo"); **troque o valor placeholder antes de qualquer uso real**.

## Estrutura de Pastas

```
/app
  page.tsx                          → home: gate de login (LoginForm) → setup da sessão
                                       (IniciarTarefaForm: perfil, cenário, conjunto de tarefa
                                       → "Iniciar Tarefa"). Participante não é mais texto livre,
                                       vem do usuário autenticado.
  /components
    LoginForm.tsx                   → formulário de código + senha, POST /api/auth/login
    IniciarTarefaForm.tsx           → formulário de setup pós-login + botão "sair"; pré-seleciona
                                       e trava cenário/conjunto já concluídos (ver "Regra de
                                       Não-Repetição"), ou mostra mensagem de participação
                                       concluída se não sobra nenhuma combinação
  /sucesso                          → tela de sucesso pós-baixa (client component; rota
                                       protegida por proxy.ts — exige login), sem sessaoId no
                                       state: "Voltar à tela inicial" ou "Finalizar participação"
  /obrigado                         → tela de agradecimento final (server component estático,
                                       NÃO protegida — o usuário já foi desativado e deslogado
                                       antes de chegar aqui)
  /admin                            → painel administrativo (ver seção "Painel Administrativo")
    page.tsx                        → gate de login próprio (AdminLoginForm) → AdminDashboard
    AdminDashboard.tsx              → orquestrador: busca sessões, botão "sair"
    /components                     → AdminLoginForm, SessoesGrid, UsuariosPainel
  /api
    /admin
      login/route.ts                → POST valida ADMIN_SENHA e grava cookie httpOnly próprio
      logout/route.ts                → POST apaga o cookie de admin
      me/route.ts                    → GET 200/401 conforme sessão de admin válida
      sessoes/route.ts               → GET todas as linhas de relatório (grid)
      export/route.ts                → GET ?formato=csv|json&usuarioId= (opcional) — download
      usuarios/route.ts               → GET lista usuários + histórico; POST cria usuário
      usuarios/[id]/route.ts          → PATCH ativa/desativa usuário
    /auth
      login/route.ts                → POST autentica e grava cookie httpOnly de sessão
      logout/route.ts                → POST apaga o cookie de sessão
      me/route.ts                    → GET usuário autenticado (401 se não logado/inativo)
      finalizar-participacao/route.ts → POST desativa o Usuario atual e encerra a sessão de
                                       login (chamado a partir de /sucesso)
    /notas-fiscais
      route.ts                      → POST cria NF
      /[id]/route.ts                 → GET NF completa (itens + lançamentos)
      /[id]/itens/route.ts           → POST registra conferência (substitui itens da NF)
      /[id]/baixa/route.ts           → POST registra baixa em estoque
    /sessoes
      route.ts                      → POST cria SessaoTeste (exige login) + limpa sessões
                                       abandonadas
      /[id]/route.ts                 → PATCH finaliza SessaoTeste (timestampFim)
      /[id]/abandonar/route.ts       → POST remove SessaoTeste não finalizada (via beacon)
    /eventos-erro/route.ts          → POST registra EventoErro
  /cenario-a                        → tela única densa (client component; rota protegida por
                                       proxy.ts — exige login)
    CenarioAApp.tsx                 → orquestrador: estado, submit em lote, modais
    /components                     → TopNavBar, FooterFKeys, FieldsetValidacao,
                                       FieldsetConferencia, FieldsetBaixa, ErrorReviewModal,
                                       DepositoModal
  /cenario-b                        → wizard de 3 passos, rota única, estado client-side (rota
                                       protegida por proxy.ts — exige login)
    CenarioBApp.tsx                 → orquestrador: passoAtual, maiorPassoAlcancado
    /components                     → TopAppBar, SideNavBar, Stepper, PassoValidacao,
                                       PassoConferencia, PassoBaixa
/lib
  prisma.ts                         → singleton do PrismaClient (com driver adapter)
  task-config.ts                    → CENARIOS, CONJUNTOS_TAREFA, PERFIS_USUARIO,
                                       ARMAZENS_DISPONIVEIS (compartilhado entre A e B)
  api-response.ts                   → helper de resposta de erro estruturado da API
  /auth                             → autenticação de participante (ver seção "Autenticação")
    constants.ts                    → SESSAO_COOKIE_NAME (compartilhado entre session.ts e proxy.ts)
    types.ts                        → UsuarioPublico (id, codigo — nunca senhaHash)
    password.ts                     → hashSenha()/verificarSenha()/gerarSenhaAleatoria()
                                       (node:crypto scrypt, sem dep. nova)
    usuario.ts                      → autenticarUsuario(), buscarUsuarioAtivoPorId(),
                                       desativarUsuario(), reativarUsuario(), listarUsuarios(),
                                       criarUsuario() (código P[Iniciais]-[Sequencial] + senha)
    session.ts                      → cookie de login (criarSessaoLogin, encerrarSessaoLogin,
                                       obterUsuarioAutenticado) via next/headers
  /admin                            → autenticação do painel admin — sem model próprio, um único
                                       segredo local (ver seção "Painel Administrativo")
    session.ts                      → cookie de admin verificado por HMAC contra ADMIN_SENHA
                                       (stateless — sem tabela nem estado em memória)
  /business-logic                   → única fonte de regras de negócio (ver seção abaixo)
    types.ts, notaFiscal.ts, conferencia.ts, estoque.ts, elegibilidade.ts (regra de
    não-repetição — ver seção "Regra de Não-Repetição")
  /instrumentation                  → única fonte de instrumentação de métricas
    types.ts                        → enum TipoEventoErro, tipos de sessão
    session.ts                      → criarSessao(), finalizarSessao()
    erros.ts                        → registrarErro(), classificarTipoErroPorMensagem()
    heuristica.ts                   → pareceCampoTrocado() (heurística de ERRO_LOGICO_CADASTRO)
    relatorio.ts                    → buscarLinhasRelatorio()/linhasParaCsv() — única fonte da
                                       linha de relatório, usada pela grid e pelo export do admin
    SessaoProvider.tsx              → contexto React: sessaoId, registrarErro, finalizarSessao,
                                       limpeza via `pagehide` + sendBeacon
/prisma
  schema.prisma
  /migrations
/scripts
  reset-db.js                       → zera o banco (ver Scripts de Execução acima) — NÃO apaga
                                       Usuario (credenciais de login não são dado de sessão de
                                       teste, sobrevivem ao reset)
  seed-usuario.js                   → cria um Usuario de teste local com código e senha
                                       escolhidos à mão (ferramenta de dev, não passa pela
                                       geração de código/senha do painel admin). Uso: `pnpm run
                                       seed:usuario -- <codigo> <senha>`
proxy.ts                            → (raiz do projeto) bloqueia acesso direto a /cenario-a e
                                       /cenario-b sem cookie de sessão — checagem otimista, só
                                       lê o cookie, não consulta o banco
vitest.config.mts                   → config do Vitest (alias "@", ver "Testes Automatizados")
*.test.ts                           → co-localizados com o arquivo testado, não numa pasta
                                       __tests__ separada (ver "Testes Automatizados")
```

## Modelo de Dados (`prisma/schema.prisma`)

```prisma
enum PerfilUsuario {
  TECNICO
  NAO_TECNICO
}

model Usuario {
  id        String        @id @default(cuid())
  codigo    String        @unique // ex: "PJS-01" — NUNCA o nome real
  senhaHash String
  ativo     Boolean       @default(true)
  createdAt DateTime      @default(now())
  sessoes   SessaoTeste[]
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
  usuarioId       String
  usuario         Usuario       @relation(fields: [usuarioId], references: [id])
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

**Privacidade**: `Usuario.codigo` guarda só um código atribuído pelo moderador — identificação
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
não bloqueia, só sinaliza), `lib/instrumentation/heuristica.ts`:
- **Cenário A**: `pareceCampoTrocado(armazem, lote)` — "Dep. Destino" não parece um código de
  armazém mas "Lote" parece, sinal de campos trocados. Não existe equivalente para
  Número da NF/Fornecedor em A (texto livre nos dois, mas essa dupla não é instrumentada aqui).
- **Cenário B**: `fornecedorPareceNumeroNota(fornecedor)` — Fornecedor preenchido só com
  dígitos, mesmo padrão do Número da NF. Não é uma heurística de "campo trocado" simétrica à
  de A, porque Número da NF em B (e em A) já tem validação rígida (só dígitos) — não há como
  esse campo "parecer" um nome de fornecedor, então o único sinal possível é o inverso.
  "Dep. Destino" em B é um `<select>` de opções fixas (prevenção de erro por design), então a
  heurística de armazém/lote de A não tem equivalente nem faz sentido em B.

## Persistência de Navegação e Aviso de Reload

Ponto 5 do pedido original tinha duas partes distintas, resolvidas de formas diferentes:

- **Aviso de reload** — `lib/instrumentation/SessaoProvider.tsx` registra um listener de
  `beforeunload` (além do `pagehide` já existente) enquanto a sessão está ativa
  (`!finalizada.current`): chama `event.preventDefault()` para disparar o aviso **nativo** do
  navegador (texto genérico, não customizável — nenhum framework permite estilizar essa caixa).
  Não persiste nada — se o participante confirmar o reload mesmo assim, a página recarrega do
  zero e todo o estado (React) some, como já acontecia antes. `router.push` (navegação
  client-side, ex: para `/sucesso`) não passa por `beforeunload` — só reload/fechar aba/navegar
  para fora disparam.
- **Persistência ao navegar de volta** — só relevante no **Cenário B**: o Cenário A é uma tela
  única sem navegação interna, então não há "voltar" a persistir ali. Em B, o Stepper
  renderiza cada Passo condicionalmente (`{passoAtual === N && <PassoX />}`), então cada Passo
  desmontava e perdia seu `useState` local toda vez que o participante saía dele. A correção
  foi **elevar o estado dos três passos para `CenarioBApp.tsx`** (`formValidacao`,
  `itensConferencia`, `formBaixa` — ver `app/cenario-b/types.ts`), que nunca desmonta durante o
  fluxo — os três `PassoX` viraram componentes controlados (`value`/`onChange` via props, mesmo
  padrão de `FieldsetValidacao` no Cenário A). Nenhum `sessionStorage`/`localStorage` é usado —
  é só React state, o que também garante de graça que reload continua limpando tudo (o estado
  vive na árvore de componentes, que reload sempre recria do zero).
- **Efeito colateral corrigido**: antes dessa mudança, voltar ao Passo 1 depois de já ter
  criado a NF e clicar "Próximo" de novo reenviava `POST /api/notas-fiscais`, o que falhava com
  erro de número duplicado (bug documentado na antiga seção "Limitação conhecida"). Agora
  `PassoValidacao` recebe a NF já criada (`notaFiscalExistente`) e, se ela existir, os campos
  ficam somente leitura e "Próximo" só navega para o Passo 2 sem reenviar nada.

## Autenticação

Login simples de participante — código + senha, cookie httpOnly (`lib/auth/`):

- `POST /api/auth/login` valida `Usuario.codigo` + `senhaHash` (verificação via
  `node:crypto` scrypt em `lib/auth/password.ts` — sem dependência externa de hashing) e,
  se o usuário existir e estiver `ativo`, grava um cookie httpOnly (`sessao_usuario`) com o
  `id` do usuário. `POST /api/auth/logout` apaga o cookie. `GET /api/auth/me` devolve o
  usuário autenticado ou 401.
- **Duas camadas de checagem**, seguindo o padrão recomendado pela documentação do Next.js
  para App Router: `proxy.ts` (raiz do projeto) faz a checagem **otimista** — só olha se o
  cookie existe, sem consultar o banco — e redireciona para `/` quem tentar acessar
  `/cenario-a` ou `/cenario-b` sem sessão. A checagem **autoritativa** (o usuário segue
  `ativo`? o id do cookie existe de fato?) acontece em `lib/auth/session.ts` →
  `obterUsuarioAutenticado()`, usada por `GET /api/auth/me` e por **toda** rota de negócio que
  grava ou lê dado de participante — `POST /api/sessoes`, `/api/notas-fiscais` (e subrotas
  `itens`/`baixa`), `PATCH /api/sessoes/[id]`, `POST /api/sessoes/[id]/abandonar` e
  `POST /api/eventos-erro`. Antes só `POST /api/sessoes` checava isso — as demais confiavam só
  na proteção de página do `proxy.ts`, o que não barra alguém chamando a API diretamente sem
  nunca ter passado pela UI. Hospedar publicamente (Vercel) tornou isso um risco real, não só
  teórico, daí a rodada de correção em todas essas rotas de uma vez.
- A home (`app/page.tsx`) não tem mais campo livre de "Código do Participante": ela checa
  `GET /api/auth/me` no mount e renderiza `LoginForm` (deslogado) ou `IniciarTarefaForm`
  (logado, com botão "sair").
- Criação de usuários tem UI própria no painel administrativo (ver "Painel Administrativo").
  `scripts/seed-usuario.js` continua existindo à parte, só para dev (código e senha escolhidos
  à mão, sem passar pela geração automática).
- `desativarUsuario()` (`lib/auth/usuario.ts`) é chamada por
  `POST /api/auth/finalizar-participacao` (ver "Telas de Encerramento") e pelo toggle manual do
  painel admin — mesma função nos dois lugares. `reativarUsuario()` é usada só pelo admin.

## Regra de Não-Repetição

Um `Usuario` não pode concluir o teste duas vezes no mesmo cenário nem com o mesmo conjunto de
tarefa (`lib/business-logic/elegibilidade.ts` — mesma convenção de `BusinessLogicError` usada
no resto de `business-logic`, não é uma regra exclusiva de auth):

- `buscarHistoricoParticipacao(usuarioId)` consulta `SessaoTeste` com `timestampFim` não nulo
  do usuário e devolve os cenários e conjuntos de tarefa já concluídos.
- **Duas camadas**, mesmo padrão da autenticação: `GET /api/auth/me` e `POST /api/auth/login`
  devolvem esse histórico junto com a identidade (`UsuarioComHistorico`), e a home
  (`IniciarTarefaForm`) usa isso para **pré-selecionar e travar** (`<select disabled>`) o
  cenário/conjunto restante quando só sobra um — checagem **otimista**, só para guiar a UI. A
  checagem **autoritativa** é `validarElegibilidade()`, chamada dentro de `POST /api/sessoes`
  antes de criar a sessão — rejeita com `BusinessLogicError` mesmo que a UI tenha sido
  contornada (DOM alterado, chamada direta à API).
- Se não sobra nenhum cenário **ou** nenhum conjunto de tarefa disponível, a home mostra uma
  mensagem de "participação concluída" no lugar do formulário. É um texto simples, não a tela
  de agradecimento final planejada — essa é escopo das "Telas de encerramento" (ver "O que
  ainda falta implementar").

## Telas de Encerramento

Ao concluir a Baixa em Estoque com sucesso, os dois cenários navegam para a mesma tela
compartilhada — não há versão "estilo Cenário A" vs. "estilo Cenário B" aqui, porque a
medição (Time-on-Task e eventos de erro) já termina em `finalizarSessao()`, antes do redirect;
essas telas ficam fora do que está sendo comparado, então usam o visual neutro já usado pela
home (zinc, sem referência de Figma):

- **Cenário A** (`CenarioAApp.tsx`): depois de `finalizarSessao()` bem-sucedido em
  `handleSalvar`, `router.push("/sucesso")`.
- **Cenário B** (`CenarioBApp.tsx` → `PassoBaixa.tsx`): mesma coisa — o antigo card inline
  "Entrada de mercadoria concluída" (mostrado dentro da própria tela) foi substituído por
  navegação para `/sucesso`; o estado `concluido` que controlava esse card foi removido por
  ficar morto depois da mudança.
- **`/sucesso`**: duas opções. "Voltar à tela inicial" só faz `router.push("/")` — a home já
  recalcula sozinha o que falta fazer (ver "Regra de Não-Repetição"), nenhuma lógica adicional
  necessária aqui. "Finalizar participação" chama `POST /api/auth/finalizar-participacao`
  (desativa o `Usuario` + encerra o cookie) e só então navega para `/obrigado`.
- **`/obrigado`**: tela final, estática, deliberadamente **fora** do `matcher` de `proxy.ts` —
  se fosse protegida, o redirect aconteceria antes do usuário conseguir ler a mensagem, já que
  nesse ponto ele acabou de ser desautenticado.

## Painel Administrativo

Rota `/admin`, login próprio e separado do login de participante (`lib/admin/`):

- **Sem model `Admin`**: é um segredo único, `ADMIN_SENHA` em `.env` (nunca commitado — troque
  o placeholder antes de qualquer uso real). `POST /api/admin/login` compara a senha enviada
  com `ADMIN_SENHA` e, se bater, grava um cookie httpOnly (`sessao_admin`) cujo valor é um
  token HMAC-SHA256 derivado de `ADMIN_SENHA` (`lib/admin/session.ts`) — verificável de forma
  **stateless** (recalcula e compara com `timingSafeEqual`), sem tabela nem estado em memória
  do processo. O cookie **não tem `maxAge`/`expires`** de propósito — é cookie de sessão do
  navegador, sempre expira ao fechar o navegador, nunca fica "lembrado" entre reinícios (acesso
  de admin é local ao pesquisador, sem cadastro de usuário admin no banco). `POST
  /api/admin/logout` apaga o cookie; `GET /api/admin/me` devolve 200/401. As 4 rotas de dados
  do admin (`sessoes`, `export`, `usuarios`, `usuarios/[id]`) já checavam
  `estaAutenticadoComoAdmin()` desde que foram criadas.
- `/admin` não passa pelo `proxy.ts` (que só cobre as rotas do participante) — faz seu próprio
  gate client-side, mesmo padrão de `app/page.tsx`: checa `GET /api/admin/me` no mount e
  renderiza `AdminLoginForm` ou `AdminDashboard`.
- **Gestão de usuários** (`UsuariosPainel.tsx`): formulário cria um `Usuario` a partir só das
  iniciais do participante — `criarUsuario()` (`lib/auth/usuario.ts`) monta o código
  `P[Iniciais]-[Sequencial]` (sequencial reinicia por grupo de iniciais, não é um contador
  global) e gera a senha com `gerarSenhaAleatoria()` (`lib/auth/password.ts`, alfabeto sem
  `0/O/1/l/I` para evitar ambiguidade na leitura). A senha só existe em texto puro na resposta
  dessa chamada — é exibida uma vez na UI, nunca mais recuperável depois (só o hash fica no
  banco). A lista mostra status (ativo/inativo, toggle via `PATCH /api/admin/usuarios/[id]`
  reaproveitando `desativarUsuario`/`reativarUsuario`) e o histórico de cenários/conjuntos já
  concluídos (reaproveita `buscarHistoricoParticipacao`, mesma função da regra de não-repetição).
- **Grid de sessões** (`SessoesGrid.tsx`) e **export** (`/api/admin/export`) compartilham a
  mesma fonte de dados — `buscarLinhasRelatorio()` (`lib/instrumentation/relatorio.ts`) — para
  a grid nunca divergir do que é exportado. Cada linha tem duração calculada
  (`timestampFim - timestampInicio`) e contagem de `EventoErro` por `TipoEventoErro`. O export
  aceita `?formato=csv|json` e `?usuarioId=` opcional (tudo vs. por participante), respondendo
  com `Content-Disposition: attachment` para o navegador baixar direto ao clicar no link — sem
  JS extra do lado do cliente.

## Testes Automatizados

**Vitest** (`vitest.config.mts`), sem Jest/Playwright ainda — decisão registrada após pesquisa
comparativa (ESM nativo combina melhor com Turbopack; Playwright fica para os smoke tests
ponta a ponta, deliberadamente adiados para **rodar só antes do primeiro teste piloto com
participante real**, não fazem parte desta rodada).

- **Arquivos `*.test.ts` co-localizados** com o código que testam (ex:
  `lib/business-logic/conferencia.test.ts` ao lado de `conferencia.ts`) — sem pasta
  `__tests__` separada.
- **Cobertura atual**: funções puras (`calcularDivergencia`, `validarElegibilidade`,
  `classificarTipoErroPorMensagem`, `pareceCampoTrocado`, `fornecedorPareceNumeroNota`,
  `hashSenha`/`verificarSenha`/`gerarSenhaAleatoria`) e os caminhos de **rejeição de
  validação** de `criarNotaFiscal`, `registrarConferenciaItens` e `registrarBaixaEstoque` —
  esses três lançam `BusinessLogicError` antes de qualquer `await prisma...`, então não
  precisam mockar nada nem tocam no banco real.
- **Mock do Prisma** (`vi.mock("@/lib/prisma", ...)`) só onde o teste precisa mesmo passar por
  uma consulta — `criarUsuario` (o algoritmo de sequencial por grupo de iniciais, apontado como
  ponto de risco na pesquisa da Sprint de testes), `autenticarUsuario` e
  `buscarHistoricoParticipacao`. Nenhum teste grava no `dev.db` real.
- **Deliberadamente fora desta rodada**: os caminhos de sucesso (`create`/`update` reais) de
  `criarNotaFiscal`, `registrarConferenciaItens` e `registrarBaixaEstoque`, e qualquer teste de
  UI/E2E — ficam cobertos depois pelos smoke tests do Playwright (login → tarefa completa →
  `/sucesso`, em cada cenário), a rodar antes do piloto.

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
- Autenticação de participante (login por código + senha, cookie httpOnly, proteção de
  `/cenario-a` e `/cenario-b` via `proxy.ts`, checagem de login em **todas** as rotas de
  negócio, não só nas páginas) — ver seção "Autenticação".
- Regra de não-repetição por cenário e conjunto de tarefa (pré-seleção/trava na home + rejeição
  no servidor) — ver seção "Regra de Não-Repetição".
- Home page com login e, após autenticado, setup de sessão (perfil, cenário, conjunto de
  tarefa) — cenário e conjunto já concluídos vêm travados; se não sobra nada, mostra mensagem
  de participação concluída.
- Telas de encerramento: `/sucesso` (voltar à home ou finalizar participação, com desativação
  automática do `Usuario`) e `/obrigado` (agradecimento final) — ver seção "Telas de
  Encerramento".
- Painel administrativo (`/admin`, login próprio via `ADMIN_SENHA`): grid de sessões com
  duração e erros por tipo, export CSV/JSON (tudo ou por participante), criação de `Usuario`
  com código/senha gerados automaticamente, ativar/desativar manual — ver seção "Painel
  Administrativo".
- Persistência de navegação no Cenário B (estado dos 3 passos elevado, sem perder dados ao usar
  o Stepper para voltar) e aviso nativo de reload em ambos os cenários — ver seção
  "Persistência de Navegação e Aviso de Reload".
- Heurística `ERRO_LOGICO_CADASTRO` também no Cenário B (Fornecedor parecendo um Nº de NF).
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
- Testes automatizados unitários (Vitest) das camadas `business-logic`, `instrumentation` e
  `auth` — ver seção "Testes Automatizados".

## O que ainda falta implementar (fora de escopo até agora)

Itens explicitamente adiados desde o pedido original, ainda não implementados:

- **Carregamento real dos conjuntos de tarefas de teste**: `CONJUNTOS_TAREFA` em
  `lib/task-config.ts` é hoje só uma lista fixa de rótulos ("Conjunto de Tarefas 1/2"). O
  conteúdo de cada conjunto (duas NFs de exemplo, com itens e divergências propositais) já foi
  definido pelo pesquisador, mas por decisão dele é entregue ao participante fora do app
  (impresso/verbal) — não precisa de UI própria, só documentação externa ao repositório.
- **Smoke tests E2E (Playwright)**: adiados de propósito — rodar antes do primeiro teste piloto
  com participante real, não antes. Ver "Testes Automatizados".
