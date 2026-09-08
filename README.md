# TCC — Pesquisa de Usabilidade: ERP Legado vs. ERP Moderno

Aplicação web desenvolvida como parte de um Trabalho de Conclusão de Curso (TCC) para
investigar, de forma empírica, o impacto do design de interface na usabilidade de sistemas
ERP. O projeto implementa **duas interfaces visualmente distintas** para o mesmo fluxo de
negócio real de um ERP (recebimento de mercadoria) e instrumenta cada sessão de uso para
coletar métricas objetivas de desempenho e erro.

## Índice

- [Sobre o projeto](#sobre-o-projeto)
- [Desenho experimental](#desenho-experimental)
- [Stack técnica](#stack-técnica)
- [Arquitetura](#arquitetura)
- [Modelo de dados](#modelo-de-dados)
- [Fluxo de negócio](#fluxo-de-negócio)
- [Regras de negócio e validações](#regras-de-negócio-e-validações)
- [Instrumentação de métricas](#instrumentação-de-métricas)
- [Autenticação e ciclo de vida do participante](#autenticação-e-ciclo-de-vida-do-participante)
- [Painel administrativo](#painel-administrativo)
- [Cenário A vs. Cenário B: o que muda e o que não muda](#cenário-a-vs-cenário-b-o-que-muda-e-o-que-não-muda)
- [Persistência de navegação e aviso de reload](#persistência-de-navegação-e-aviso-de-reload)
- [Testes automatizados](#testes-automatizados)
- [Como rodar o projeto](#como-rodar-o-projeto)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Exceções, comportamentos especiais e limitações conhecidas](#exceções-comportamentos-especiais-e-limitações-conhecidas)
- [Privacidade e ética de pesquisa](#privacidade-e-ética-de-pesquisa)
- [Referências de design (Figma)](#referências-de-design-figma)
- [Roadmap](#roadmap)

## Sobre o projeto

A pesquisa parte de uma observação comum em ambientes corporativos: sistemas ERP legados
(SAP GUI, TOTVS Protheus e similares) são notoriamente densos, pouco intuitivos e resistentes
a mudanças, apesar de décadas de evolução no design de interfaces. A pergunta que este TCC
investiga é: **o quanto o design da interface, isoladamente, afeta o desempenho e a taxa de
erro de um usuário realizando a mesma tarefa de negócio?**

Para responder isso com rigor, o experimento não compara "um ERP" com "outro ERP", compara
duas *interfaces* diferentes para **exatamente a mesma lógica de negócio, rodando sobre a
mesma API e o mesmo banco de dados**. Qualquer diferença de resultado entre os dois grupos de
teste só pode, portanto, ser atribuída ao design, não a diferenças de regra de negócio, de
dado disponível ou de comportamento do servidor.

O experimento mede dois indicadores por sessão de participante:

- **Time-on-Task** — tempo entre o clique em "Iniciar Tarefa" e a conclusão bem-sucedida da
  tarefa.
- **Taxa de Erros por tipo** — quantos eventos de erro de cada categoria (ver
  [Instrumentação de Métricas](#instrumentação-de-métricas)) o participante gerou ao longo da
  tentativa.

## Desenho experimental

O fluxo de negócio testado é sempre o mesmo, independente da interface:

> **Recebimento de Nota Fiscal → Conferência de Itens → Baixa em Estoque**

Ou seja: o participante recebe os dados de uma nota fiscal fictícia (impressos ou verbais,
fora do sistema), cadastra a nota, confere manualmente os itens recebidos contra o pedido, e
por fim lança a entrada em estoque, informando o depósito de destino e o lote.

Cada participante realiza a tarefa **duas vezes**, uma em cada cenário, usando conjuntos de
dados diferentes entre as duas tentativas (para evitar efeito de aprendizado/memorização do
conteúdo específico da nota fiscal). O sistema garante automaticamente essa regra: ver
[Regra de não-repetição](#autenticação-e-ciclo-de-vida-do-participante).

### Cenário A — Interface Legada

Réplica visual do padrão SAP GUI / TOTVS Protheus: menu de transação no topo, toolbar densa
com ícones, **uma única tela** com todos os campos das três etapas visíveis simultaneamente,
sem nenhuma validação em tempo real (o participante só descobre erros ao clicar em "Salvar"),
rodapé com teclas de função (F2–F12, no estilo terminal 3270/SAP).

### Cenário B — Interface Moderna

Aplicação das heurísticas de usabilidade de Nielsen: **wizard guiado de 3 passos**, validação
em tempo real campo a campo, feedback visual imediato (bordas vermelhas, badges de status),
navegação por Stepper clicável, e prevenção de erro por design onde faz sentido, por exemplo,
o campo de depósito de destino é um `<select>` de opções fixas em vez de texto livre, evitando
por construção um erro que no Cenário A é possível (digitar um código de depósito inválido).

### A regra metodológica inegociável

> **Os dois cenários compartilham 100% da mesma lógica de negócio, API e banco de dados.**
> A única coisa que pode divergir entre eles é a camada visual/front-end.

Isso é garantido estruturalmente pelo código, não apenas por convenção: nenhum componente de
tela (`app/cenario-a/**`, `app/cenario-b/**`) importa lógica de negócio diretamente. Os dois
só chamam os mesmos endpoints HTTP em `app/api/**`, que por sua vez só importam de
`lib/business-logic/` e `lib/prisma.ts`. Um diagrama simplificado:

```
Cenário A (UI)  ─┐
                  ├──► /app/api/** ──► lib/business-logic/** ──► Prisma ──► PostgreSQL
Cenário B (UI)  ─┘
```

Diferenças de **padrão de interação** são intencionais e fazem parte do que está sendo
medido — não violam a regra, porque a lógica e os dados por trás continuam idênticos:

| Aspecto | Cenário A | Cenário B |
|---|---|---|
| Validação | Só no submit final | Em tempo real (blur/campo a campo) |
| Depósito de destino | Texto livre + modal de busca | `<select>` de opções fixas |
| Navegação | Tela única | Wizard de 3 passos com Stepper |
| Estilo visual | Denso, cinza, ícones pequenos | Espaçado, cards, cores de status |

## Stack técnica

- **[Next.js 16](https://nextjs.org)** (App Router, Turbopack) + **TypeScript** — front-end e
  back-end no mesmo processo, via Route Handlers (`app/api/**`).
- **[Prisma 7](https://www.prisma.io)** + **PostgreSQL** ([Prisma Postgres](https://www.prisma.io/postgres),
  hospedado), via driver adapter `@prisma/adapter-pg` + `pg` (Prisma 7 exige um adapter
  explícito, não aceita mais conexão direta por `DATABASE_URL`). Rodou em SQLite local
  (`@prisma/adapter-better-sqlite3`) até a migração para hospedagem pública.
- **[Tailwind CSS v4](https://tailwindcss.com)** para estilo, sem arquivo central de design
  tokens; cores e espaçamentos foram extraídos diretamente do Figma e aplicados como classes
  arbitrárias componente a componente (ex.: `text-[#004ac6]`).
  **[lucide-react](https://lucide.dev)** para ícones.
- **[Vitest](https://vitest.dev)** para testes unitários e **[Playwright](https://playwright.dev)**
  para smoke tests E2E (ver [Testes Automatizados](#testes-automatizados)).
- **pnpm** como gerenciador de pacotes — **obrigatório**, não usar `npm`/`yarn`. A versão está
  fixada em `package.json` (`packageManager: "pnpm@10.33.0"`).

Não há backend separado: o mesmo processo Next.js serve as páginas e as API Routes; só o banco
de dados (Postgres) é externo, hospedado. Não há filas, cache distribuído ou qualquer outra
infraestrutura além disso.

## Arquitetura

O projeto segue uma separação estrita em camadas, reforçada pela regra metodológica do
experimento:

| Camada | Responsabilidade | Pasta |
|---|---|---|
| **UI dos cenários** | Renderização, interação, chamadas HTTP para a API | `app/cenario-a/`, `app/cenario-b/` |
| **UI compartilhada** | Login, setup de sessão, telas de encerramento, painel admin | `app/page.tsx`, `app/components/`, `app/sucesso/`, `app/obrigado/`, `app/admin/` |
| **API** | Route Handlers HTTP - validam autenticação/sessão e delegam para a camada de negócio | `app/api/**` |
| **Regras de negócio** | Única fonte de validação e regras do domínio (NF, conferência, baixa, elegibilidade) | `lib/business-logic/` |
| **Instrumentação** | Cronômetro de sessão e registro dos 4 tipos de evento de erro | `lib/instrumentation/` |
| **Autenticação** | Login de participante (hash de senha, cookie de sessão) | `lib/auth/` |
| **Admin** | Autenticação do painel administrativo (segredo único, sem tabela própria) | `lib/admin/` |
| **Persistência** | Cliente Prisma singleton | `lib/prisma.ts`, `prisma/schema.prisma` |

Toda resposta de erro da API segue um formato estruturado único -
`{ erros: [{ campo, mensagem }] }` - usado tanto para exibir a mensagem ao usuário quanto para
alimentar a instrumentação de erros (ver adiante). Nenhuma operação grava parcialmente: as
funções de negócio validam tudo antes de tocar no banco e lançam `BusinessLogicError` em caso
de falha.

## Modelo de dados

```prisma
enum PerfilUsuario {
  TECNICO
  NAO_TECNICO
}

model Usuario {
  id        String        @id @default(cuid())
  codigo    String        @unique // ex: "PJS-01" — NUNCA o nome real do participante
  senhaHash String
  ativo     Boolean       @default(true)
  createdAt DateTime      @default(now())
  sessoes   SessaoTeste[]
}

model NotaFiscal {
  id                 String              @id @default(cuid())
  numero             String
  fornecedor         String
  dataEmissao        DateTime
  valorTotal         Float
  createdAt          DateTime            @default(now())
  itensRecebidos     ItemRecebido[]
  lancamentosEstoque LancamentoEstoque[]
}

model ItemRecebido {
  id           String     @id @default(cuid())
  codigo       String
  descricao    String
  qtdPedida    Float
  qtdRecebida  Float
  unidade      String
  notaFiscalId String
  notaFiscal   NotaFiscal @relation(fields: [notaFiscalId], references: [id])
}

model LancamentoEstoque {
  id           String     @id @default(cuid())
  armazem      String
  lote         String
  quantidade   Float
  status       String     // "CONCLUIDO" | "CONCLUIDO_COM_DIVERGENCIA"
  notaFiscalId String
  notaFiscal   NotaFiscal @relation(fields: [notaFiscalId], references: [id])
  createdAt    DateTime   @default(now())
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

Pontos que merecem atenção:

- **`Usuario.codigo` nunca é o nome real do participante**: é um código atribuído pelo
  pesquisador no formato `P[Iniciais]-[Sequencial]` (ex.: `PJS-01`). A identificação real,
  quando necessária (ex.: para o Termo de Consentimento Livre e Esclarecido), fica em registro
  físico ou separado, nunca neste banco.
- **`SessaoTeste` é o registro central do experimento**: guarda quem (`usuarioId`), com qual
  perfil, em qual cenário, com qual conjunto de tarefa, e os dois timestamps que definem o
  Time-on-Task.
- **`EventoErro.sessao` tem `onDelete: Cascade`**: se uma sessão é descartada (abandono, ver
  adiante), seus eventos de erro somem junto, nunca ficam órfãos no banco.
- **`LancamentoEstoque.status`**: é derivado automaticamente da comparação entre quantidade
  pedida e recebida — nunca escolhido pelo usuário.

## Fluxo de negócio

O fluxo de negócio é **idêntico** nos dois cenários e implementado inteiramente em
`lib/business-logic/`, consumido pela API:

1. **Recebimento** — `POST /api/notas-fiscais` cria a `NotaFiscal` a partir dos dados
   informados (número, fornecedor, data de emissão, valor total).
2. **Conferência** — `POST /api/notas-fiscais/[id]/itens` recebe a lista de itens **inseridos
   manualmente pelo participante** (código, descrição, quantidade pedida, quantidade recebida,
   unidade — não há nenhum pré-preenchimento) e calcula a divergência de cada item
   (`qtdRecebida ≠ qtdPedida`). Essa chamada **substitui** a lista de itens da NF por completo
   a cada envio — reenviar a conferência (por exemplo, ao voltar um passo e confirmar de novo)
   é seguro e idempotente.
3. **Baixa** — `POST /api/notas-fiscais/[id]/baixa` cria o `LancamentoEstoque`, com `status`
   derivado da divergência calculada no passo anterior (`CONCLUIDO` ou
   `CONCLUIDO_COM_DIVERGENCIA`). É bloqueada se a nota ainda não tiver itens conferidos.

## Regras de negócio e validações

Toda validação acontece **no servidor**, dentro de `lib/business-logic/`, nunca só no
client, o client valida "cedo" só para dar feedback rápido (no Cenário B), mas a fonte da
verdade é sempre a API.

| Campo | Regra |
|---|---|
| `NotaFiscal.numero` | Obrigatório, **apenas dígitos** (`/^\d+$/`) — **não é único**: o mesmo conjunto de tarefa (mesmo número de NF) é reaplicado a cada participante, repetir entre sessões é esperado |
| `NotaFiscal.fornecedor` | Obrigatório, qualquer caractere aceito |
| `NotaFiscal.dataEmissao` | Obrigatória, precisa ser uma data válida |
| `NotaFiscal.valorTotal` | Obrigatório, numérico, **pode ser zero** (ex.: item recebido como brinde/permuta), não pode ser negativo |
| `ItemRecebido.codigo` / `.descricao` / `.unidade` | Obrigatórios |
| `ItemRecebido.qtdPedida` | Obrigatória, **deve ser maior que zero** |
| `ItemRecebido.qtdRecebida` | Obrigatória, **deve ser maior que zero** |
| `LancamentoEstoque.armazem` | Obrigatório, texto livre — não validado quanto ao conteúdo |
| `LancamentoEstoque.lote` | Obrigatório, texto livre, divergências de conteúdo só detectáveis por heurística (ver instrumentação), **nunca bloqueadas** |
| `LancamentoEstoque.quantidade` | Obrigatória, **deve ser maior que zero** |
| Baixa sem conferência prévia | Bloqueada — a nota precisa ter ao menos um item conferido |

Duas decisões de design vale destacar:

- **Padrão vazio-vs-zero**: no client, campos numéricos ficam como *texto* no estado da
  interface até o momento do envio, e só então são convertidos — se o campo estava vazio, vira
  `undefined` (nunca é coagido para `0`). Essa distinção é o que permite diferenciar, na
  instrumentação, um "campo não preenchido" (`INPUT_OBRIGATORIO_VAZIO`) de um "campo
  preenchido com um valor inválido, como zero" (`ERRO_VALIDACAO_CAMPO`).
- **Divergência de item**: `qtdRecebida - qtdPedida ≠ 0`. Uma nota com pelo menos um item
  divergente tem sua baixa registrada com `status = "CONCLUIDO_COM_DIVERGENCIA"` — o sistema
  **nunca bloqueia** a divergência, apenas a sinaliza, refletindo o comportamento real de um
  ERP (divergência de recebimento é uma ocorrência operacional normal, não um erro fatal).

## Instrumentação de métricas

### Time-on-Task

- `timestampInicio` é gravado no clique em **"Iniciar Tarefa"** na home
  (`POST /api/sessoes`).
- `timestampFim` só é gravado no **sucesso** da Baixa em Estoque — nunca antes, nunca em caso
  de erro. Isso significa que o tempo medido inclui qualquer tempo perdido em erros e
  retentativas, o que é exatamente o comportamento desejado para medir usabilidade real.
- **Sessões abandonadas nunca persistem no banco.** Se o participante fecha a aba, recarrega a
  página ou navega para fora antes de terminar, um listener de `pagehide` dispara
  `navigator.sendBeacon` para `POST /api/sessoes/[id]/abandonar`, que apaga a sessão (só se
  `timestampFim` ainda for nulo — uma sessão já concluída nunca é apagada por essa rota). Como
  rede de segurança adicional (cobre casos em que o beacon não chegou a disparar, como um
  crash do navegador), toda nova chamada a `POST /api/sessoes` primeiro limpa qualquer
  `SessaoTeste` pendente sem `timestampFim`.

### Taxa de erros — 4 tipos

Os quatro tipos vivem no enum `TipoEventoErro` (`lib/instrumentation/types.ts`) e são
registrados via `registrarErro()`, chamada de forma idêntica nos dois cenários:

**`CLIQUE_FORA_FLUXO`** — clique em um elemento decorativo/não funcional, ou uma tentativa de
navegação fora de ordem. Todo elemento decorativo da interface tem um handler dedicado — **não
existe clique morto** em nenhum dos dois cenários.
- No Cenário A: itens do menu superior (Menu/Edit/Favorites/Extras/System/Help), ícones da
  toolbar, teclas de função do rodapé (F3/F5/F7/F12 — **F2 é a única funcional**, aciona o
  salvamento real, replicando o padrão real de atalhos SAP), o botão "Pesquisar" da
  Conferência.
- No Cenário B: itens do menu lateral, ícones do topo (sino, engrenagem, apps), itens de
  navegação (Home/Analytics/Audit), avatar do usuário, e clique no Stepper em um passo **ainda
  não alcançado**. Navegar livremente entre passos já alcançados (para frente ou para trás)
  **não** conta como erro — só pular além do maior passo já atingido é sinalizado, já que o
  passo 2 exige a NF já criada e o passo 3 exige a conferência já confirmada.

**`INPUT_OBRIGATORIO_VAZIO`** — um campo obrigatório foi deixado vazio. No Cenário B isso é
detectado em tempo real (ao sair do campo ou tentar submeter, antes mesmo de chamar a API); no
Cenário A só é detectado depois da resposta da API no submit final — por design, já que o
Cenário A não tem validação em tempo real (fidelidade à experiência do sistema legado).

**`ERRO_VALIDACAO_CAMPO`** — um campo foi preenchido, mas com um valor tecnicamente inválido
(texto onde se espera número, número negativo, zero onde a regra exige maior que zero, número
de NF com letras, número de NF duplicado, etc.). **Toda** resposta de erro estruturado vinda da
API é processada por completo — cada item do array `erros[]` retornado vira uma chamada a
`registrarErro()`, então nenhum erro mostrado ao usuário deixa de virar um evento registrado.
A função `classificarTipoErroPorMensagem()` (usada identicamente pelos dois cenários) decide o
tipo: mensagem contendo "obrigat" → `INPUT_OBRIGATORIO_VAZIO`, qualquer outra →
`ERRO_VALIDACAO_CAMPO`.

**`ERRO_LOGICO_CADASTRO`** — um dado tecnicamente aceito pelo sistema, mas semanticamente
incoerente. O sistema **não bloqueia** esse tipo de erro (o dado é aceito e salvo normalmente),
só o sinaliza — reflete o comportamento real de ERPs, que raramente têm meios de impedir um
usuário de, por exemplo, trocar dois campos de lugar. As duas heurísticas implementadas, em
`lib/instrumentation/heuristica.ts`:
- **Cenário A** — `pareceCampoTrocado(armazem, lote)`: dispara quando o campo "Dep. Destino"
  não se parece com um código de armazém válido (padrão `LetraDígitoDígito`, ex. `D01`) mas o
  campo "Lote" se parece — sinal de que os dois campos foram preenchidos trocados.
- **Cenário B** — `fornecedorPareceNumeroNota(fornecedor)`: dispara quando o campo Fornecedor
  está preenchido só com dígitos, no mesmo padrão do Número da NF. Essa heurística não é
  simétrica à de armazém/lote por uma razão de design: o campo Número da NF já tem validação
  rígida (só aceita dígitos) em ambos os cenários, então ele fisicamente não pode "parecer" um
  nome de fornecedor — o único sinal de troca possível é o inverso. Da mesma forma, o campo
  "Dep. Destino" no Cenário B é um `<select>` de opções fixas (prevenção de erro por design),
  então a heurística de armazém/lote do Cenário A simplesmente não tem equivalente nem faz
  sentido ali.

## Autenticação e ciclo de vida do participante

O acesso ao experimento é controlado por um login simples de participante — código + senha,
sem cadastro livre:

1. O pesquisador cria um `Usuario` pelo [painel administrativo](#painel-administrativo),
   informando só as iniciais do participante. O sistema gera o código
   (`P[Iniciais]-[Sequencial]`) e uma senha aleatória, exibida **uma única vez** na tela — é
   responsabilidade do pesquisador repassar essas credenciais ao participante fora do sistema.
2. O participante acessa a home e faz login (`POST /api/auth/login`). A senha é verificada por
   hash (`node:crypto` `scrypt`, sem dependência externa) contra `Usuario.senhaHash`. Se
   válido e o usuário estiver `ativo`, um cookie httpOnly (`sessao_usuario`) é gravado.
3. Depois de logado, o participante escolhe o **perfil** (Técnico / Não técnico), o
   **cenário** e o **conjunto de tarefa**, e clica em "Iniciar Tarefa" — isso cria a
   `SessaoTeste` e começa a contagem do Time-on-Task.
4. Ao concluir a tarefa com sucesso, o participante cai na tela **`/sucesso`**, com duas
   opções: **"Voltar à tela inicial"** (para fazer o segundo cenário) ou **"Finalizar
   participação"** (desativa o `Usuario`, impedindo login futuro, e encerra a sessão de
   login, terminando em **`/obrigado`**, a tela final de agradecimento).

### Regra de não-repetição

Um mesmo `Usuario` **não pode** concluir o teste duas vezes no mesmo cenário nem com o mesmo
conjunto de tarefa. Isso é garantido em duas camadas, o mesmo padrão usado em todo o projeto:

- **Camada otimista (UI)**: ao logar, a home consulta o histórico de sessões concluídas do
  usuário e **pré-seleciona e trava** (`<select disabled>`) o cenário/conjunto restante quando
  só sobra uma opção. Se não sobra nenhuma combinação válida, a home mostra uma mensagem de
  participação já concluída em vez do formulário.
- **Camada autoritativa (API)**: `POST /api/sessoes` valida a elegibilidade no servidor antes
  de criar qualquer sessão nova, rejeitando com erro estruturado mesmo que a interface tenha
  sido contornada (DOM alterado manualmente, chamada direta à API).

### Duas camadas de proteção de rota

Seguindo o padrão recomendado pela documentação do Next.js para App Router: `proxy.ts`, na
raiz do projeto, faz uma checagem **otimista** (só verifica se o cookie de sessão existe, sem
consultar o banco) antes de renderizar `/cenario-a`, `/cenario-b` ou `/sucesso`, redirecionando
para a home quem não tiver sessão. A checagem **autoritativa** (o usuário realmente existe e
segue ativo?) acontece nas API Routes, via `obterUsuarioAutenticado()`.

## Painel administrativo

Rota `/admin`, com **login próprio e completamente separado** do login de participante — um
pesquisador não usa as mesmas credenciais dos participantes.

- **Sem tabela de administradores**: a autenticação é baseada em um único segredo,
  `ADMIN_SENHA`, definido em `.env` (nunca commitado no repositório — **troque o valor
  placeholder antes de qualquer uso real**). Ao logar com a senha correta, o servidor grava um
  cookie httpOnly cujo valor é um token HMAC-SHA256 derivado da própria `ADMIN_SENHA` —
  verificável de forma **stateless** (recalculado e comparado a cada requisição, sem tabela
  nem estado em memória do processo).
- **Gestão de participantes**: criação de `Usuario` a partir das iniciais (gera código e
  senha automaticamente, como descrito acima), listagem com status (ativo/inativo) e histórico
  de cenários/conjuntos já concluídos, e ativação/desativação manual, útil, por exemplo, para
  reabrir a participação de alguém que precisou repetir um teste por problema técnico.
- **Grid de sessões e exportação de dados**: uma tabela com todas as sessões registradas —
  participante, perfil, cenário, conjunto de tarefa, duração, e a contagem de eventos de erro
  por tipo. Os dados podem ser exportados em **CSV ou JSON**, para todos os participantes de
  uma vez ou filtrados por um único participante, pronto para importar direto em uma
  ferramenta de análise estatística (R, Python/pandas, Excel).

## Cenário A vs. Cenário B: o que muda e o que não muda

Esta seção resume o que é intencionalmente diferente entre os dois cenários (o próprio objeto
de estudo) e reforça o que precisa continuar idêntico para o experimento ser válido.

**Pode variar (e varia, de propósito):**
- Layout, cores, tipografia, densidade de informação na tela.
- Padrão de validação (submit-only vs. tempo real).
- Tipo de controle de formulário (texto livre + busca vs. `<select>`).
- Navegação (tela única vs. wizard).
- Quais heurísticas de `ERRO_LOGICO_CADASTRO` fazem sentido em cada tela (consequência direta
  da diferença de controles de formulário, não uma inconsistência).

**Nunca pode variar:**
- As regras de validação de negócio (mesmas funções em `lib/business-logic/`, chamadas pelos
  mesmos endpoints).
- O cálculo de divergência e o status resultante da baixa.
- A definição de início/fim do Time-on-Task.
- Os 4 tipos de evento de erro e o critério de quando cada um dispara (a mesma mensagem de erro
  vinda da mesma regra de negócio é sempre classificada da mesma forma).
- O schema do banco de dados e o formato de resposta da API.

## Persistência de navegação e aviso de reload

Dois comportamentos relacionados a não perder o trabalho do participante, mas resolvidos de
formas diferentes:

- **Aviso nativo de reload**: enquanto uma sessão está ativa (tarefa ainda não concluída), os
  dois cenários registram um listener de `beforeunload` que aciona o aviso **nativo** do
  navegador ("Sair do site? As alterações podem não ser salvas") ao tentar recarregar a
  página, fechar a aba ou navegar para fora. Esse texto é do próprio navegador — nenhum
  framework web permite customizá-lo. O aviso **não** persiste nenhum dado: se o participante
  confirmar a saída mesmo assim, o formulário volta em branco, como esperado.
- **Persistência ao navegar de volta**: relevante só no **Cenário B**, já que o Cenário A é
  uma tela única sem navegação interna. No wizard de 3 passos, o estado dos três formulários
  (dados da NF, itens conferidos, dados da baixa) vive no componente pai (`CenarioBApp.tsx`),
  não em cada passo individualmente — assim, usar o Stepper para ir e voltar entre passos já
  alcançados nunca perde o que foi digitado. Como efeito colateral positivo, isso também
  eliminou um bug conhecido: voltar ao primeiro passo depois de já ter criado a nota fiscal e
  confirmar de novo não tenta mais recriar a NF (o que criaria uma segunda `NotaFiscal`
  duplicada pra mesma sessão) — o passo reconhece que a NF já existe e os campos ficam
  somente leitura.

## Testes automatizados

O projeto usa duas camadas de teste automatizado, com escopos deliberadamente diferentes:
**[Vitest](https://vitest.dev)** para lógica de negócio isolada e **[Playwright](https://playwright.dev)**
para smoke tests ponta a ponta contra um servidor e um banco reais.

### Testes unitários (Vitest)

A escolha em vez de Jest veio de uma pesquisa comparativa registrada no processo do TCC:
suporte nativo a ESM combina melhor com o Turbopack do Next.js 16, com configuração mais
simples.

- Arquivos `*.test.ts` ficam **co-localizados** com o código que testam (ex.:
  `lib/business-logic/conferencia.test.ts` ao lado de `conferencia.ts`), sem uma pasta
  `__tests__` separada.
- **O que está coberto**: as funções puras do domínio (cálculo de divergência, validação
  de elegibilidade, classificação de tipo de erro, as duas heurísticas de
  `ERRO_LOGICO_CADASTRO`, hash/verificação/geração de senha) e os caminhos de **rejeição de
  validação** das funções de negócio (`criarNotaFiscal`, `registrarConferenciaItens`,
  `registrarBaixaEstoque`) — essas três lançam erro antes de qualquer chamada ao banco, então
  os testes de rejeição não precisam mockar nada. Onde um teste precisa mesmo passar por uma
  consulta ao banco (o algoritmo de geração de código sequencial em `criarUsuario`, o login em
  `autenticarUsuario`, a consulta de histórico em `buscarHistoricoParticipacao`), o Prisma é
  mockado — **nenhum teste grava no banco de desenvolvimento real**.
- **Deliberadamente fora desta camada**: os caminhos de sucesso (escrita real no banco) das
  três funções de negócio citadas, e qualquer teste de UI — cobertos pelos smoke tests E2E.

```bash
pnpm test
```

### Smoke tests E2E (Playwright)

Rodam contra um servidor Next.js real (`pnpm run dev`, subido automaticamente pelo próprio
Playwright) conectado ao **Postgres real** — não um banco de teste separado. Cada teste cria
seu próprio `Usuario`/`NotaFiscal` com prefixos reconhecíveis (`E2E-...`, número de NF
começando em `99`, iniciais de admin `ZZ...`), e um `globalTeardown` apaga tudo isso ao final
da suíte inteira, com sucesso ou falha — nunca toca em dado real.

- **Roda sequencialmente (`workers: 1`)**, de propósito: `POST /api/sessoes` limpa qualquer
  sessão de teste abandonada no banco inteiro como rede de segurança (a aplicação assume um
  único participante por vez, não é multi-tenant) — em paralelo, um teste apagaria a sessão em
  andamento de outro.
- **Cobertura**: login/logout e proteção de rota; fluxo de sucesso completo (com e sem
  divergência) em cada cenário; persistência de navegação do Cenário B; os **4 tipos de
  `EventoErro`** em cada cenário, verificando o disparo **e** a gravação real na tabela; regra
  de não-repetição (trava de UI e rejeição no servidor mesmo contornando o client); telas de
  encerramento (`/sucesso`, `/obrigado`, desativação de usuário); painel administrativo
  (login, criação/ativação/desativação de usuário).
- `ADMIN_SENHA` é lido do `.env` real em tempo de execução — nunca hardcoded no arquivo de
  teste.

```bash
pnpm run test:e2e
```

**Depois de rodar**, `pnpm run db:reset -- --yes` é uma rede de segurança extra antes de
qualquer coleta real (o teardown já limpa sozinho).

## Como rodar o projeto

```bash
# 1. Instalar dependências (roda os build scripts aprovados automaticamente)
pnpm install

# 2. Configurar o .env — DATABASE_URL precisa ser a connection string de um banco
#    Postgres (ex: Prisma Postgres) e ADMIN_SENHA uma senha real seguindo o
#    placeholder do exemplo

# 3. Aplicar as migrations no banco
pnpm exec prisma migrate dev

# 4. Subir o servidor de desenvolvimento
pnpm run dev
```

A aplicação sobe em `http://localhost:3000`. A home (`/`) pede login de participante; o painel
administrativo fica em `/admin`, com login separado via `ADMIN_SENHA`.

### Outros scripts úteis

| Comando | Efeito |
|---|---|
| `pnpm run build` / `pnpm run start` | Build e execução em modo produção |
| `pnpm run lint` | ESLint |
| `pnpm exec tsc --noEmit` | Checagem de tipos sem gerar arquivos |
| `pnpm exec prisma studio` | GUI local para inspecionar o banco |
| `pnpm test` | Suíte de testes unitários (Vitest) |
| `pnpm run test:e2e` | Suíte de smoke tests E2E (Playwright) |
| `pnpm run db:reset` | **Zera o banco de dados** (apaga sessões, notas e eventos — preserva os `Usuario` cadastrados). Pede confirmação; use `-- --yes` para pular o prompt |
| `pnpm run seed:usuario -- <codigo> <senha>` | Cria um `Usuario` de teste local, sem passar pela geração automática do painel admin — só para desenvolvimento |

**Antes de qualquer coleta de dados real com participantes**, rode `pnpm run db:reset` para
garantir que a base começa vazia, e confirme que `ADMIN_SENHA` foi trocada do placeholder.

## Estrutura de pastas

```
/app
  page.tsx                 → home: login → setup de sessão (perfil, cenário, conjunto de tarefa)
  /components               LoginForm, IniciarTarefaForm
  /sucesso                 → tela de sucesso pós-tarefa
  /obrigado                → tela final de agradecimento (não exige login)
  /admin                   → painel administrativo (login próprio)
  /api
    /auth                   login, logout, me, finalizar-participacao
    /admin                  login, logout, me, sessoes, export, usuarios
    /notas-fiscais          CRUD de nota fiscal, itens, baixa
    /sessoes                criação/finalização/abandono de SessaoTeste
    /eventos-erro           registro de EventoErro
  /cenario-a                tela única densa (SAP/Protheus-like)
  /cenario-b                wizard de 3 passos (moderno)
/lib
  prisma.ts                 singleton do Prisma Client
  task-config.ts             opções compartilhadas (cenários, conjuntos, perfis, depósitos)
  api-response.ts             helper de resposta de erro estruturado
  /auth                      autenticação de participante
  /admin                     autenticação do painel administrativo
  /business-logic             única fonte de regras de negócio
  /instrumentation             cronômetro + registro dos 4 tipos de erro
/prisma
  schema.prisma, /migrations
/scripts
  reset-db.js, seed-usuario.js
proxy.ts                     proteção de rota para /cenario-a, /cenario-b, /sucesso
vitest.config.mts            configuração dos testes unitários
playwright.config.ts          configuração dos smoke tests E2E
/e2e                          smoke tests E2E (specs + helpers, ver Testes Automatizados)
```

## Exceções, comportamentos especiais e limitações conhecidas

- **Sessões nunca ficam "penduradas"**: uma sessão iniciada e nunca concluída (aba fechada,
  crash, reload confirmado) é sempre removida do banco — nunca aparece na grid do admin nem
  entra nas estatísticas. Isso é intencional: o experimento só quer medir tentativas
  completas.
- **Divergência de quantidade nunca bloqueia a baixa**: é um comportamento operacional
  esperado de um ERP real, não um erro do usuário. O sistema só a sinaliza no status final.
- **`ERRO_LOGICO_CADASTRO` nunca bloqueia o cadastro**: por definição, é um erro que o sistema
  tecnicamente aceita; bloquear descaracterizaria o que está sendo medido (o quanto o design
  ajuda o usuário a perceber sozinho um erro que o sistema não pega).
- **O aviso de reload usa o texto nativo do navegador**:, fora do controle da aplicação — não é
  possível estilizá-lo ou traduzir seu conteúdo por completo em todos os navegadores.
- **O conteúdo real dos conjuntos de tarefa não fica no código**: `CONJUNTOS_TAREFA` em
  `lib/task-config.ts` só define os rótulos (“Conjunto de Tarefas 1/2”); os dados de exemplo
  de cada conjunto (duas notas fiscais fictícias, com itens e divergências propositais) foram
  definidos pelo pesquisador e são entregues ao participante fora do sistema
  (impresso ou verbalmente), por decisão de desenho do experimento.
- **A desativação de um `Usuario` é definitiva até reativação manual**: — depois de "Finalizar
  participação", aquele código de acesso para de funcionar; só o painel admin pode reverter
  isso.
- **Os smoke tests E2E rodam sequencialmente, nunca em paralelo** — reflexo direto da
  rede de segurança de `POST /api/sessoes` (limpa qualquer sessão de teste pendente no banco
  inteiro), que por sua vez reflete o uso real do sistema: um único participante por vez. Ver
  [Testes Automatizados](#testes-automatizados).

## Privacidade e ética de pesquisa

- `Usuario.codigo` é sempre um identificador arbitrário (`P[Iniciais]-[Sequencial]`) atribuído
  pelo pesquisador, **o nome real do participante nunca é armazenado no banco de dados**.
  Qualquer vínculo entre código e identidade real (necessário, por exemplo, para o Termo de
  Consentimento Livre e Esclarecido) deve ficar em registro físico ou separado, fora deste
  sistema.
- Senhas de participante e a senha do painel administrativo são armazenadas apenas como hash
  (`scrypt`), nunca em texto puro — a única vez que uma senha de participante aparece em texto
  puro é na tela de criação de usuário no painel admin, exibida uma única vez para o
  pesquisador copiar/repassar.
- A connection string do banco de dados fica só em `DATABASE_URL` (`.env`, ou variável de
  ambiente do host de deploy), nunca versionada no Git (`.gitignore`).

## Referências de design (Figma)

Arquivo: **TCC 2 - ERP** — `fileKey KsYffsjp19qRrqxS44UGlr`
<https://www.figma.com/design/KsYffsjp19qRrqxS44UGlr/TCC-2---ERP>

| Tela | Node |
|---|---|
| Cenário B — Passo 1: Validação | [`1:9`](https://www.figma.com/design/KsYffsjp19qRrqxS44UGlr/TCC-2---ERP?node-id=1-9) |
| Cenário B — Passo 2: Conferência | [`1:169`](https://www.figma.com/design/KsYffsjp19qRrqxS44UGlr/TCC-2---ERP?node-id=1-169) |
| Cenário B — Passo 3: Baixa | [`1:399`](https://www.figma.com/design/KsYffsjp19qRrqxS44UGlr/TCC-2---ERP?node-id=1-399) |
| Cenário A — Tela única (legado) | [`1:623`](https://www.figma.com/design/KsYffsjp19qRrqxS44UGlr/TCC-2---ERP?node-id=1-623) |

As telas foram implementadas a partir do design extraído desses nós. Cores, espaçamentos e
tipografia foram aplicados como classes arbitrárias do Tailwind componente a componente — não
há um arquivo central de tokens de design; qualquer ajuste visual deve ser comparado
diretamente com o frame correspondente no Figma. Ícones foram substituídos por equivalentes do
`lucide-react` (fidelidade visual próxima, sem custo de exportação de assets).

## Roadmap

O que ainda falta antes da coleta de dados com participantes reais:

1. **Teste piloto** com 1–2 participantes reais, para validar tempo de tarefa, clareza da
   instrução externa dos conjuntos de tarefa, e ajustar qualquer atrito encontrado antes da
   coleta em escala.
2. **Coleta de dados** propriamente dita, seguida de exportação via painel admin e análise
   estatística comparando Time-on-Task e Taxa de Erros por tipo entre os dois cenários.
