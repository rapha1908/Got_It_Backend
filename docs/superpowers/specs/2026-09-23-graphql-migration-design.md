# Migração REST → GraphQL

- **Data:** 2026-09-23
- **Branch:** `GraphQL` (a partir de `prisma`)
- **Status:** aprovado em conversa, aguardando revisão da spec

## Objetivo

Substituir por completo a API REST do backend por uma API GraphQL servida em `POST /graphql`, mantendo intactas as camadas de `entities`, `use-cases`, `repository` e o Prisma. O schema deve expor os relacionamentos do domínio como campos aninhados (condomínio → serviços → checklists/fotos, staff → skills), sem problemas de N+1.

Hoje nenhum cliente consome a API (o `../frontend` não faz chamadas a ela), então não há período de convivência REST + GraphQL.

### Critérios de sucesso

1. Toda operação existente em REST tem equivalente no schema GraphQL.
2. Autenticação JWT funciona como hoje: `login` e `createUser` públicos, todo o resto exige `Authorization: Bearer <token>`.
3. Nenhum campo `password` exposto no schema.
4. Consultas aninhadas fazem uma chamada em lote por nível (DataLoader).
5. `npm run lint`, `npx tsc --noEmit` e `npm test` passam.

## Stack

| Peça | Escolha |
|---|---|
| Servidor | Apollo Server 5 + `@as-integrations/express5`, montado em `/graphql` no Express 5 existente |
| Schema | Pothos (code-first) — `@pothos/core` |
| Plugins Pothos | `@pothos/plugin-scope-auth`, `@pothos/plugin-validation` (Zod 4 via Standard Schema), `@pothos/plugin-dataloader` |
| Proteção | `graphql-depth-limit` (máx. 7) |
| Testes | Vitest + Postgres de teste via docker compose |

**Não** será usado `@pothos/plugin-prisma`: ele acoplaria o schema ao Prisma e contornaria use cases e repositórios. O fluxo continua sendo `resolver → factory → use case → repository`.

## Estrutura

```
src/
  app.ts               # Express + express.json() + /graphql (Apollo)
  server.ts            # await server.start() antes do listen
  graphql/
    builder.ts         # SchemaBuilder, plugins, tipos Context e AuthScopes
    context.ts         # lê Authorization → { userId: number | null, loaders }
    loaders.ts         # cria os DataLoaders por request
    errors.ts          # formatError (mapeamento de erros)
    server.ts          # instancia ApolloServer (schema, formatError, validationRules, introspection)
    schema.ts          # importa modules/* e exporta builder.toSchema()
    modules/
      auth.ts          # login, me
      user.ts          # User, createUser, user(email)
      manager.ts       # Manager, createManager, manager(userId)
      staff.ts         # Staff, Skill, createStaff, createSkill, addSkillToStaff, staff(userId)
      condominium.ts   # Condominium, createCondominium, condominiums, condominium(id)
      service.ts       # Service, PhotoService, CheckList, CheckListItem + mutations, service(id)
```

### Removido

- `src/http/` inteiro (controllers, rotas, `ensure-auth.ts`)
- `src/docs/swagger.ts` e as dependências `swagger-jsdoc`, `swagger-ui-express`, `@types/swagger-jsdoc`, `@types/swagger-ui-express`
- `src/utils/global-error-handler.ts` (substituído por `src/graphql/errors.ts`)
- `src/use-cases/find-staff-skills.ts` e sua factory (substituído pelo campo `Staff.skills`)
- `docs/api-miro.md` é reescrito como `docs/api-graphql.md`, com exemplos de queries e mutations

### Mantido

`entities/`, `repository/` (com métodos novos), `use-cases/` (com use cases novos), `lib/`, `env/`, Prisma e migrations.

## Autenticação

- `context.ts` extrai o token do header `Authorization: Bearer <token>` e valida com `jwt.verify(token, env.JWT_SECRET)`. Token válido → `userId = Number(sub)`; ausente ou inválido → `userId = null`.
- O `login` continua assinando `{ type }` com `subject = String(user.id)` e `expiresIn: "1d"`.
- Scope `authenticated: !!context.userId`. `builder.queryType` e `builder.mutationType` declaram `authScopes: { authenticated: true }`, o que torna privado **todo** campo de Query e Mutation. As únicas exceções, `Mutation.login` e `Mutation.createUser`, usam `skipTypeScopes: true`.
- Falha de scope → erro com `extensions.code = "UNAUTHENTICATED"`, mensagem `"Not authenticated"`.
- Autorização por papel (Manager/Staff) fica fora do escopo.

## Schema

Campos em camelCase no GraphQL, mapeados do snake_case das entidades. Nenhum tipo expõe `password`.

### Tipos

| Tipo | Escalares | Relacionamentos |
|---|---|---|
| `User` | `id: Int!`, `name`, `email`, `type` | `manager: Manager`, `staff: Staff` |
| `Manager` | `id`, `userId`, `name`, `phone`, `nif` | `user: User!`, `condominiums: [Condominium!]!` |
| `Staff` | `id`, `userId`, `name`, `phone`, `nif` | `user: User!`, `skills: [Skill!]!`, `services: [Service!]!` |
| `Skill` | `id`, `name` | — |
| `Condominium` | `id`, `name`, `address`, `city`, `state`, `zip`, `country` | `managers: [Manager!]!`, `services: [Service!]!` |
| `Service` | `id: ID!` (UUID), `description`, `startDate: String!` (YYYY-MM-DD), `endDate`, `status`, `price: Float!` | `condominium: Condominium!`, `staff: Staff!`, `photos: [PhotoService!]!`, `checkLists: [CheckList!]!` |
| `PhotoService` | `id`, `photoUrl`, `createdAt: String!` (ISO) | — |
| `CheckList` | `id`, `description`, `createdAt` | `items: [CheckListItem!]!` |
| `CheckListItem` | `id`, `description`, `completed: Boolean!` | — |
| `AuthPayload` | `token: String!` | `user: User!` |

Os escalares são non-null (`!`), a não ser que a tabela indique outra coisa.

### Queries

| Query | Substitui | Use case |
|---|---|---|
| `me: User!` | `GET /auth/me` | `FindUserByIdUseCase` (novo) |
| `user(email: String!): User` | `GET /users/:email` | `FindUserUseCase` |
| `manager(userId: Int!): Manager!` | `GET /managers/:user_id` | `FindWithManagerUseCase` (NOT_FOUND se inexistente) |
| `staff(userId: Int!): Staff!` | `GET /staff/:user_id` | `FindWithStaffUseCase` (NOT_FOUND se inexistente) |
| `condominiums: [Condominium!]!` | `GET /condominiums` | `FindCondominiumsUseCase` |
| `condominium(id: Int!): Condominium!` | `GET /condominiums/:id/services` (via campo `services`) | `FindCondominiumByIdUseCase` (novo, NOT_FOUND) |
| `service(id: ID!): Service!` | `GET /services/:id/photos` e `/check-lists` (via campos) | `FindServiceByIdUseCase` (novo, NOT_FOUND) |

### Mutations

Todas recebem `input: <Nome>Input!` validado pelo mesmo schema Zod usado hoje no controller correspondente e retornam a entidade criada (sem envelope `{ message, data }`).

| Mutation | Retorno | Substitui | Público |
|---|---|---|---|
| `login(input: { email, password })` | `AuthPayload!` | `POST /auth/login` | sim |
| `createUser(input: { name, email, password, type: "Manager" \| "Staff" })` | `User!` | `POST /users` | sim |
| `createManager(input)` | `Manager!` | `POST /managers` | não |
| `createStaff(input)` | `Staff!` | `POST /staff` | não |
| `createSkill(input: { name })` | `Skill!` | `POST /skills` | não |
| `addSkillToStaff(input: { staffId, skillId })` | `Staff!` | `POST /staff/:id/skills` | não |
| `createCondominium(input: { ..., managerIds })` | `Condominium!` | `POST /condominiums` | não |
| `createService(input)` | `Service!` | `POST /services` | não |
| `createPhotoService(input: { serviceId, photoUrl })` | `PhotoService!` | `POST /services/:id/photos` | não |
| `createCheckList(input: { serviceId, description })` | `CheckList!` | `POST /services/:id/check-lists` | não |
| `createCheckListItem(input: { checkListId, description, completed })` | `CheckListItem!` | `POST /check-lists/:id/items` | não |

O hash bcrypt da senha em `createUser` e a verificação em `login` continuam iguais a hoje. `type` vira um enum GraphQL `UserType { Manager, Staff }`.

### Mudanças de comportamento em relação ao REST

- `Staff.skills` vazio retorna `[]`; o 404 atual do `FindStaffSkillsUseCase` deixa de existir.
- `findWithManager`/`findWithStaff` hoje mesclam `user` e `manager`/`staff` num único objeto (o `id` do manager/staff sobrescreve o do user). No GraphQL, `Manager` e `Staff` expõem os próprios campos, e o usuário é acessado por `user`. Os repositórios passam a retornar o registro de manager/staff sem mesclar.
- `user(email)` não retorna mais o hash da senha.

## DataLoaders

`loaders.ts` cria novas instâncias por request, no `context`. Os loaders chamam os repositórios diretamente, porque carregamento em lote é preocupação de acesso a dados. Queries e mutations continuam passando por use cases.

| Loader | Chave → valor | Método de repositório (novo) |
|---|---|---|
| `userById` | `userId → User` | `IUserRepository.findByIds(ids)` |
| `managerByUserId` | `userId → Manager \| null` | `IManagerRepository.findByUserIds(ids)` |
| `staffByUserId` | `userId → Staff \| null` | `IStaffRepository.findByUserIds(ids)` |
| `managersByCondominiumId` | `condominiumId → Manager[]` | `IManagerRepository.findByCondominiumIds(ids)` |
| `staffById` | `staffId → Staff` | `IStaffRepository.findByIds(ids)` |
| `skillsByStaffId` | `staffId → Skill[]` | `IStaffSkillRepository.findSkillsByStaffIds(ids)` |
| `condominiumById` | `id → Condominium` | `ICondominiumRepository.findByIds(ids)` |
| `condominiumsByManagerId` | `managerId → Condominium[]` | `ICondominiumRepository.findByManagerIds(ids)` |
| `servicesByCondominiumId` | `condominiumId → Service[]` | `IServiceRepository.findByCondominiumIds(ids)` |
| `servicesByStaffId` | `staffId → Service[]` | `IServiceRepository.findByStaffIds(ids)` |
| `photosByServiceId` | `serviceId → PhotoService[]` | `IPhotoServiceRepository.findByServiceIds(ids)` |
| `checkListsByServiceId` | `serviceId → CheckList[]` (com `items`) | `ICheckListRepository.findByServiceIds(ids)` |

Métodos de busca individual também novos: `ICondominiumRepository.findById`, `IServiceRepository.findById` e `IUserRepository.findById` (este último pode reaproveitar `findByUserId` sem a mescla com manager).

Cada método em lote faz **uma** query Prisma com `where: { <campo>: { in: ids } }`. O loader reordena ou agrupa o resultado conforme as chaves.

## Erros

`formatError` em `src/graphql/errors.ts`, olhando `error.originalError`:

| Origem | `extensions.code` | Mensagem |
|---|---|---|
| `ZodError` / erro do validation plugin | `BAD_USER_INPUT` | detalhes dos campos inválidos |
| `ResourceNotFoundError` | `NOT_FOUND` | mensagem do erro |
| `InvalidCredentialsError` (novo, em `use-cases/errors/`) | `UNAUTHENTICATED` | `"Invalid credentials"` |
| Falha de auth scope | `UNAUTHENTICATED` | `"Not authenticated"` |
| `Prisma.PrismaClientKnownRequestError` com code `P2002` (unique) | `BAD_USER_INPUT` | `"Resource already exists"` |
| `Prisma.PrismaClientKnownRequestError` com code `P2003` (FK) | `BAD_USER_INPUT` | `"Related resource not found"` |
| Qualquer outro | `INTERNAL_SERVER_ERROR` | `"Internal server error"`; em `development`, `console.error(error)` |

Erros de sintaxe e validação do próprio GraphQL (códigos gerados pelo Apollo) passam sem alteração. `includeStacktraceInErrorResponses` só em `development`.

## Servidor

- `introspection` ligada apenas quando `NODE_ENV !== "production"`. O Apollo Sandbox fica disponível em `GET /graphql` nesse modo.
- `validationRules: [depthLimit(7)]`.
- `env` passa a aceitar `NODE_ENV = "test"`.
- `server.ts`: `await apollo.start()` antes de montar o middleware e chamar `listen`. A montagem fica numa função `createApp()` que os testes reutilizam.

## Testes

- **Vitest** configurado com o alias `@/` → `src/`, scripts `test` e `test:watch`.
- **Banco de teste:** serviço `postgres-test` no `docker-compose.yml` (porta 5433, sem volume) e `.env.test` apontando para ele. O `globalSetup` roda `prisma migrate deploy`; um helper `resetDb()` faz `TRUNCATE ... RESTART IDENTITY CASCADE` em todas as tabelas antes de cada arquivo de teste.
- **Execução:** `apollo.executeOperation({ query, variables }, { contextValue })`, com o context construído pelo mesmo `buildContext` de produção a partir de um header fake.

Casos mínimos:

1. **Auth:** `condominiums` sem token → `UNAUTHENTICATED`; `createUser` e `login` funcionam sem token.
2. **Login:** credenciais erradas → `UNAUTHENTICATED`; credenciais certas retornam um token, e `me` com esse token devolve o usuário, sem campo `password` no schema.
3. **Validação:** `createUser` com email inválido → `BAD_USER_INPUT`; email duplicado → `BAD_USER_INPUT`.
4. **Not found:** `manager(userId: 999)` → `NOT_FOUND`.
5. **Relacionamentos:** dados semeados com 2 condomínios, cada um com 2 serviços com fotos e checklists. `condominiums { services { staff { name } photos { photoUrl } checkLists { items { completed } } } }` retorna a árvore correta.
6. **N+1:** na mesma query, com spies nos métodos `findBy*Ids`, cada um é chamado exatamente 1 vez.
7. **Repositórios em lote:** cada `findBy*Ids` retorna os registros certos para múltiplos ids e `[]` para ids sem registros.

## Verificação final

- `npm run lint`
- `npx tsc --noEmit`
- `npm test`
- Smoke manual: `npm run docker:up` e depois, no Apollo Sandbox, login → `me` → criar condomínio, serviço, checklist e foto → consulta aninhada.

## Fora do escopo (próximos passos)

- Upload real de fotos (hoje `photoUrl` é string)
- Autorização por papel (Manager vs Staff)
- Paginação nas listas
- Subscriptions
- Queries e mutations de update/delete (não existem hoje em REST)
