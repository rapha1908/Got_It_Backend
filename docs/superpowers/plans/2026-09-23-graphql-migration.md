# Migração REST → GraphQL: plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar este plano tarefa por tarefa. Os passos usam checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** substituir a API REST (Express + controllers) por uma API GraphQL em `POST /graphql`, reaproveitando `entities`, `use-cases`, `repository` e Prisma.

**Arquitetura:** Apollo Server 5 montado no Express 5 via `@as-integrations/express5`. O schema é code-first com Pothos: scope-auth para JWT, validation com os schemas Zod e dataloader para os relacionamentos sem N+1. Os resolvers de Query e Mutation chamam as factories de use case. Os campos de relacionamento usam `t.loadable` / `t.loadableGroup`, que chamam métodos em lote dos repositórios.

**Tech stack:** TypeScript 5.9 (executado via `tsx`, CommonJS), Express 5.2, Prisma 6.19 (PostgreSQL), Zod 4.3, `@apollo/server` 5.5.1, `@as-integrations/express5` 1.1.2, `graphql` 16.14.2, `@pothos/core` 4.15.1, `@pothos/plugin-scope-auth` 4.2.1, `@pothos/plugin-validation` 4.3.4, `@pothos/plugin-dataloader` 4.4.6, `dataloader` 2.2.3, `graphql-depth-limit` 1.1.0, Vitest 5.0.1, Vite 8.3.0.

**Spec:** `docs/superpowers/specs/2026-09-23-graphql-migration-design.md`

## Restrições globais

- Branch de trabalho: `GraphQL`. Não fazer push nem merge.
- `.npmrc` tem `save-exact=true`. Instale sempre com as versões exatas listadas acima.
- `graphql` precisa ser **16.x**. O `@apollo/server` 5 exige `graphql ^16.11.0`; não instale o 17.
- O projeto é CommonJS (sem `"type": "module"`). Não use top-level `await` em `src/`.
- Imports internos usam o alias `@/` → `src/` (tsconfig `paths`).
- Campos GraphQL em camelCase. Entidades e repositórios continuam em snake_case.
- Nenhum tipo GraphQL expõe `password`.
- Públicos: só `Mutation.login` e `Mutation.createUser`. Todo o resto exige `Authorization: Bearer <token>`.
- Códigos de erro (`extensions.code`): `BAD_USER_INPUT`, `NOT_FOUND`, `UNAUTHENTICATED`, `INTERNAL_SERVER_ERROR`. Mensagens fixas: `"Not authenticated"`, `"Invalid credentials"`, `"Resource already exists"` (Prisma P2002), `"Related resource not found"` (Prisma P2003), `"Internal server error"`.
- Profundidade máxima de query: 7 (`graphql-depth-limit`).
- **O `.env` aponta para um banco Neon remoto.** Testes só podem tocar em `localhost:5433`. A trava `assertTestDatabase` (Task 1) é obrigatória em todo caminho que migra ou trunca.
- Toda mensagem de commit termina com a linha `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
- Ao fim de cada task, `npx tsc --noEmit`, `npm run lint` e `npm test` passam.

## Foco de revisão

Casos que a spec implica, mas que nenhum requisito explícito cobre. Cada um tem um teste na task indicada.

1. **Teste rodando contra o banco de produção.** O `.env` com Neon vaza para o processo de teste: `resetDb`/`migrate` precisam recusar qualquer `DATABASE_URL` fora de `localhost:5433` (Task 1).
2. **Token malformado, expirado, com esquema errado (`Basic`) ou `Bearer` sem token.** Deve responder `UNAUTHENTICATED` com `"Not authenticated"`, nunca 500 (Task 4).
3. **Listas vazias em relacionamentos.** Staff sem skills e condomínio sem serviços devem retornar `[]`, não erro nem `null` (Tasks 5 e 6).
4. **Ids relacionados inexistentes ou duplicados em mutations.** `managerIds` com id inexistente → `BAD_USER_INPUT "Related resource not found"`; `managerIds` repetidos → deduplicados; skill adicionada duas vezes → `BAD_USER_INPUT "Resource already exists"` (Tasks 5 e 6).
5. **Datas e preço em round-trip.** `startDate: "2026-01-31"` e `price: 10.5` voltam idênticos, sem deslocamento de fuso nem perda de decimal (Task 6).

---

## Estrutura de arquivos

**Criar:**

| Arquivo | Responsabilidade |
|---|---|
| `vitest.config.ts` | Config do Vitest: alias `@`, env de teste, globalSetup, execução serial |
| `.env.test` | Variáveis do banco de teste (`localhost:5433`) |
| `test/global-setup.ts` | Trava de banco + `prisma migrate deploy` no banco de teste |
| `test/helpers/test-env.ts` | `loadTestEnv()`, `assertTestDatabase()` |
| `test/helpers/reset-db.ts` | `resetDb()`: `TRUNCATE ... RESTART IDENTITY CASCADE` |
| `test/helpers/factories.ts` | `seed*()`: cria registros via Prisma para os testes |
| `test/helpers/graphql.ts` | `execute()`: roda operações via `executeOperation`; `tokenFor()` |
| `src/lib/jwt.ts` | `signToken()`, `verifyToken()` |
| `src/graphql/builder.ts` | `SchemaBuilder` + plugins + `queryType`/`mutationType` privados |
| `src/graphql/context.ts` | `Context`, `buildContext(authorization)` |
| `src/graphql/refs.ts` | `objectRef`s e enums compartilhados (evita import circular entre módulos) |
| `src/graphql/errors.ts` | `formatError` do Apollo |
| `src/graphql/server.ts` | `createApolloServer()` |
| `src/graphql/schema.ts` | Importa os módulos e exporta `schema` |
| `src/graphql/utils/order-by-keys.ts` | Reordena resultados em lote na ordem das chaves do DataLoader |
| `src/graphql/modules/{auth,user,manager,staff,condominium,service}.ts` | Tipos, campos, queries e mutations de cada domínio |
| `src/use-cases/authenticate.ts` | `AuthenticateUseCase` |
| `src/use-cases/errors/invalid-credentials-error.ts` | `InvalidCredentialsError` |
| `src/use-cases/find-user-by-id.ts`, `find-staff-by-id.ts`, `find-condominium-by-id.ts`, `find-service-by-id.ts` | Buscas por id que lançam `ResourceNotFoundError` |
| Factories correspondentes em `src/use-cases/factory/**` | Seguem o padrão `make*UseCase()` existente |
| `docs/api-graphql.md` | Documentação da API (substitui `docs/api-miro.md`) |

**Modificar:** `package.json`, `tsconfig.json`, `docker-compose.yml`, `src/env/index.ts`, `src/app.ts`, `src/server.ts`, entidades (`user`, `manager`, `check-list`, `staff-skill`, `condominium`), todas as interfaces e implementações de repositório.

**Remover (Task 7):** `src/http/`, `src/docs/`, `src/utils/global-error-handler.ts`, use cases `find-staff-skills`, `find-services-by-condominium`, `find-photos-by-service`, `find-check-lists-by-service` e suas factories, métodos de repositório sem uso, `docs/api-miro.md`, dependências de Swagger.

---

### Task 1: Infraestrutura de testes

**Arquivos:**
- Criar: `.env.test`, `vitest.config.ts`, `test/global-setup.ts`, `test/helpers/test-env.ts`, `test/helpers/reset-db.ts`
- Modificar: `docker-compose.yml`, `package.json`, `tsconfig.json`, `src/env/index.ts`
- Teste: `test/infra.test.ts`

**Interfaces:**
- Produz: `loadTestEnv(): Record<string, string>`, `assertTestDatabase(url: string | undefined): void`, `resetDb(): Promise<void>`; scripts `npm test`, `npm run test:watch`, `npm run db:test:up`.

- [ ] **Passo 1: Escrever o teste que falha**

`test/infra.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma/db";
import { resetDb } from "./helpers/reset-db";
import { assertTestDatabase } from "./helpers/test-env";

describe("test infrastructure", () => {
  beforeEach(resetDb);

  it("connects to the test database with an empty schema", async () => {
    expect(process.env.DATABASE_URL).toContain("@localhost:5433/");
    await expect(prisma.user.count()).resolves.toBe(0);
  });

  it("refuses to touch a non-test database", () => {
    expect(() =>
      assertTestDatabase("postgresql://u:p@ep-x-pooler.eu-central-1.aws.neon.tech/neondb"),
    ).toThrow(/non-test database/);
    expect(() => assertTestDatabase("postgresql://u:p@localhost:5432/postgres")).toThrow(
      /non-test database/,
    );
    expect(() => assertTestDatabase(undefined)).toThrow(/non-test database/);
  });
});
```

- [ ] **Passo 2: Rodar e confirmar a falha**

Rode `npx vitest run`. Esperado: falha, porque o `vitest` não está instalado (`command not found` / `could not determine executable`).

- [ ] **Passo 3: Instalar as dependências de teste**

```bash
npm i -D vitest@5.0.1 vite@8.3.0
```

- [ ] **Passo 4: Adicionar o Postgres de teste ao `docker-compose.yml`**

Adicione em `services:`, depois de `postgres:`. O `profiles: ["test"]` impede que `npm run docker:up` suba esse serviço.

```yaml
  postgres-test:
    image: postgres:16-alpine
    container_name: got-it-postgres-test
    profiles: ["test"]
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: gotit_test
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test -d gotit_test"]
      interval: 2s
      timeout: 5s
      retries: 15
```

- [ ] **Passo 5: Criar o `.env.test`**

Ele é commitado de propósito: só contém credenciais do container local de teste.

```
PORT=3001
NODE_ENV=test

POSTGRES_USER=test
POSTGRES_PASSWORD=test
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=gotit_test

JWT_SECRET=test-secret
DATABASE_URL=postgresql://test:test@localhost:5433/gotit_test
```

- [ ] **Passo 6: Aceitar `NODE_ENV=test` em `src/env/index.ts`**

Troque a linha do `NODE_ENV`:

```ts
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
```

- [ ] **Passo 7: Criar `test/helpers/test-env.ts`**

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "dotenv";

export const TEST_DATABASE_HOST = "localhost:5433";

export function loadTestEnv(): Record<string, string> {
  return parse(readFileSync(path.resolve(process.cwd(), ".env.test")));
}

export function assertTestDatabase(url: string | undefined): void {
  if (!url || !url.includes(`@${TEST_DATABASE_HOST}/`)) {
    throw new Error(
      `Refusing to touch a non-test database: DATABASE_URL must point to ${TEST_DATABASE_HOST}`,
    );
  }
}
```

- [ ] **Passo 8: Criar `test/helpers/reset-db.ts`**

```ts
import { prisma } from "@/lib/prisma/db";
import { assertTestDatabase } from "./test-env";

const TABLES = [
  "check_list_items",
  "check_lists",
  "photo_services",
  "services",
  "staff_skills",
  "skills",
  "staff",
  "condominium_managers",
  "condominiums",
  "managers",
  "users",
];

export async function resetDb(): Promise<void> {
  assertTestDatabase(process.env.DATABASE_URL);
  const tables = TABLES.map((table) => `"${table}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
}
```

- [ ] **Passo 9: Criar `test/global-setup.ts`**

```ts
import { execSync } from "node:child_process";
import { assertTestDatabase, loadTestEnv } from "./helpers/test-env";

export default function setup(): void {
  const testEnv = loadTestEnv();
  assertTestDatabase(testEnv.DATABASE_URL);
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, ...testEnv },
  });
}
```

- [ ] **Passo 10: Criar `vitest.config.ts`**

`test.env` é aplicado ao `process.env` dos workers antes de qualquer import. O `dotenv/config` de `src/env` não sobrescreve variáveis já definidas, então o `DATABASE_URL` de teste prevalece sobre o `.env`.

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";
import { loadTestEnv } from "./test/helpers/test-env";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(process.cwd(), "src") },
  },
  test: {
    env: loadTestEnv(),
    globalSetup: ["./test/global-setup.ts"],
    include: ["test/**/*.test.ts"],
    fileParallelism: false,
  },
});
```

- [ ] **Passo 11: Scripts e tsconfig**

Em `package.json` → `scripts`, substitua a linha `"test"` e adicione:

```json
    "test": "vitest run",
    "test:watch": "vitest",
    "db:test:up": "docker compose --profile test up -d --wait postgres-test",
```

Em `tsconfig.json`, troque o `include`. O ESLint usa `parserOptions.project`, então arquivos fora do tsconfig quebram o lint.

```json
  "include": ["src/**/*.ts", "test/**/*.ts", "vitest.config.ts"],
```

- [ ] **Passo 12: Subir o banco e rodar os testes**

```bash
npm run db:test:up
npm test
```

Esperado: `test/infra.test.ts` com 2 testes passando.

Se `prisma migrate deploy` falhar reclamando da falta de `migration_lock.toml`, crie `prisma/migrations/migration_lock.toml` com:

```toml
provider = "postgresql"
```

Depois rode de novo.

- [ ] **Passo 13: Verificar tipos e lint**

Rode `npx tsc --noEmit && npm run lint`. Esperado: sem erros.

- [ ] **Passo 14: Commit**

```bash
git add .env.test vitest.config.ts test docker-compose.yml package.json package-lock.json tsconfig.json src/env/index.ts prisma/migrations
git commit -m "Add Vitest setup with isolated Postgres test database

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Repositórios de identidade (user, manager, staff, skill) e factories de teste

**Arquivos:**
- Modificar: `src/entities/models/user.interface.ts`, `src/entities/user.entity.ts`, `src/entities/models/manager.interface.ts`, `src/entities/models/staff-skill.interface.ts`
- Modificar: `src/repository/user.repository.interface.ts`, `src/repository/manager.repository.interface.ts`, `src/repository/staff.repository.interface.ts`, `src/repository/staff-skill.repository.interface.ts` e as implementações em `src/repository/prisma/`
- Modificar: `src/use-cases/find-with-manager.ts`, `src/use-cases/find-with-staff.ts`
- Criar: `src/use-cases/find-user-by-id.ts`, `src/use-cases/find-staff-by-id.ts`, `src/use-cases/factory/user/make-find-user-by-id-usecase.ts`, `src/use-cases/factory/staff/make-find-staff-by-id-usecase.ts`
- Criar: `test/helpers/factories.ts`
- Teste: `test/repository/identity.repository.test.ts`

**Interfaces:**
- Consome: `resetDb()` (Task 1).
- Produz:
  - `IUser.id?: number`, `UserEntity.id?: number`, `IManager.id?: number`
  - `ISkillOfStaff extends ISkill { staff_id: number }` (em `staff-skill.interface.ts`)
  - `IUserRepository.findById(id: number): Promise<UserEntity | null>`, `findByIds(ids: number[]): Promise<UserEntity[]>`
  - `IManagerRepository.findWithManager(user_id: number): Promise<IManager | undefined>` (sem mesclar user), `findByIds(ids: number[]): Promise<IManager[]>`, `findByUserIds(user_ids: number[]): Promise<IManager[]>`
  - `IStaffRepository.findWithStaff(user_id: number): Promise<IStaff | undefined>` (sem mesclar), `findById(id: number): Promise<IStaff | null>`, `findByIds(ids: number[]): Promise<IStaff[]>`, `findByUserIds(user_ids: number[]): Promise<IStaff[]>`
  - `IStaffSkillRepository.findSkillsByStaffIds(staff_ids: number[]): Promise<ISkillOfStaff[]>`
  - `FindUserByIdUseCase.handle(id: number): Promise<UserEntity>` e `FindStaffByIdUseCase.handle(id: number): Promise<IStaff>`, ambos lançando `ResourceNotFoundError`; factories `makeFindUserByIdUseCase()` e `makeFindStaffByIdUseCase()`
  - `test/helpers/factories.ts`: `DEFAULT_PASSWORD`, `seedUser`, `seedManager`, `seedStaff`, `seedSkill`, `seedStaffSkill`, `seedCondominium`, `seedService`, `seedPhoto`, `seedCheckList`, `seedCheckListItem`

- [ ] **Passo 1: Criar `test/helpers/factories.ts`**

As factories inserem direto via Prisma, sem passar pelos repositórios que estão sendo testados.

```ts
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma/db";

let sequence = 0;
const next = () => ++sequence;

export const DEFAULT_PASSWORD = "password123";

type UserType = "Manager" | "Staff";

export async function seedUser(
  data: Partial<{ name: string; email: string; password: string; type: UserType }> = {},
) {
  const n = next();
  return prisma.user.create({
    data: {
      name: data.name ?? `User ${n}`,
      email: data.email ?? `user${n}@test.com`,
      password: await hash(data.password ?? DEFAULT_PASSWORD, 4),
      type: data.type ?? "Manager",
    },
  });
}

export async function seedManager(user_id?: number, data: Partial<{ name: string }> = {}) {
  const userId = user_id ?? (await seedUser({ type: "Manager" })).id;
  return prisma.manager.create({
    data: { user_id: userId, name: data.name ?? `Manager ${next()}`, phone: "910000000", nif: "123456789" },
  });
}

export async function seedStaff(user_id?: number, data: Partial<{ name: string }> = {}) {
  const userId = user_id ?? (await seedUser({ type: "Staff" })).id;
  return prisma.staff.create({
    data: { user_id: userId, name: data.name ?? `Staff ${next()}`, phone: "920000000", nif: "987654321" },
  });
}

export async function seedSkill(name?: string) {
  return prisma.skill.create({ data: { name: name ?? `Skill ${next()}` } });
}

export async function seedStaffSkill(staff_id: number, skill_id: number) {
  return prisma.staffSkill.create({ data: { staff_id, skill_id } });
}

export async function seedCondominium(manager_ids: number[], data: Partial<{ name: string }> = {}) {
  return prisma.condominium.create({
    data: {
      name: data.name ?? `Condominium ${next()}`,
      address: "Rua A, 1",
      city: "Lisboa",
      state: "Lisboa",
      zip: "1000-001",
      country: "PT",
      managers: { create: manager_ids.map((manager_id) => ({ manager_id })) },
    },
  });
}

export async function seedService(
  condominium_id: number,
  staff_id: number,
  data: Partial<{ description: string; start_date: string; end_date: string; price: number }> = {},
) {
  return prisma.service.create({
    data: {
      id: randomUUID(),
      condominium_id,
      staff_id,
      description: data.description ?? `Service ${next()}`,
      start_date: new Date(data.start_date ?? "2026-01-10"),
      end_date: new Date(data.end_date ?? "2026-01-20"),
      status: "pending",
      price: new Prisma.Decimal(data.price ?? 100),
    },
  });
}

export async function seedPhoto(service_id: string, photo_url?: string) {
  return prisma.photoService.create({
    data: { service_id, photo_url: photo_url ?? `https://img.test/${next()}.jpg` },
  });
}

export async function seedCheckList(service_id: string, description?: string) {
  return prisma.checkList.create({
    data: { service_id, description: description ?? `Check list ${next()}` },
  });
}

export async function seedCheckListItem(
  check_list_id: number,
  data: Partial<{ description: string; completed: boolean }> = {},
) {
  return prisma.checkListItem.create({
    data: {
      check_list_id,
      description: data.description ?? `Item ${next()}`,
      completed: data.completed ?? false,
    },
  });
}
```

- [ ] **Passo 2: Escrever o teste que falha**

`test/repository/identity.repository.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { PrismaManagerRepository } from "@/repository/prisma/manager.repository";
import { PrismaStaffSkillRepository } from "@/repository/prisma/staff-skill.repository";
import { PrismaStaffRepository } from "@/repository/prisma/staff.repository";
import { PrismaUserRepository } from "@/repository/prisma/user.repository";
import { FindStaffByIdUseCase } from "@/use-cases/find-staff-by-id";
import { FindUserByIdUseCase } from "@/use-cases/find-user-by-id";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-erro";
import * as seed from "../helpers/factories";
import { resetDb } from "../helpers/reset-db";

const ids = <T extends { id?: number }>(rows: T[]) => rows.map((row) => row.id).sort();

describe("identity repositories", () => {
  beforeEach(resetDb);

  describe("PrismaUserRepository", () => {
    const repository = new PrismaUserRepository();

    it("findByIds returns only the requested users", async () => {
      const [a, b] = [await seed.seedUser(), await seed.seedUser()];
      await seed.seedUser();
      expect(ids(await repository.findByIds([a.id, b.id]))).toEqual([a.id, b.id].sort());
    });

    it("findByIds returns [] for unknown ids", async () => {
      expect(await repository.findByIds([999])).toEqual([]);
    });

    it("findById returns the user or null", async () => {
      const user = await seed.seedUser({ email: "ana@test.com" });
      expect(await repository.findById(user.id)).toEqual(expect.objectContaining({ email: "ana@test.com" }));
      expect(await repository.findById(999)).toBeNull();
    });
  });

  describe("PrismaManagerRepository", () => {
    const repository = new PrismaManagerRepository();

    it("findWithManager returns the manager record without merging the user", async () => {
      const user = await seed.seedUser({ name: "Ana" });
      const manager = await seed.seedManager(user.id, { name: "Ana Manager" });

      const found = await repository.findWithManager(user.id);

      expect(found).toEqual(expect.objectContaining({ id: manager.id, user_id: user.id, name: "Ana Manager" }));
      expect(found).not.toHaveProperty("email");
      expect(found).not.toHaveProperty("password");
    });

    it("findByIds and findByUserIds batch-load managers", async () => {
      const [a, b] = [await seed.seedManager(), await seed.seedManager()];
      expect(ids(await repository.findByIds([a.id, b.id, 999]))).toEqual([a.id, b.id].sort());
      expect(ids(await repository.findByUserIds([a.user_id, 999]))).toEqual([a.id]);
    });
  });

  describe("PrismaStaffRepository", () => {
    const repository = new PrismaStaffRepository();

    it("findWithStaff returns the staff record without merging the user", async () => {
      const user = await seed.seedUser({ type: "Staff" });
      const staff = await seed.seedStaff(user.id, { name: "Bruno" });

      const found = await repository.findWithStaff(user.id);

      expect(found).toEqual(expect.objectContaining({ id: staff.id, user_id: user.id, name: "Bruno" }));
      expect(found).not.toHaveProperty("email");
    });

    it("findById, findByIds and findByUserIds", async () => {
      const [a, b] = [await seed.seedStaff(), await seed.seedStaff()];
      expect(await repository.findById(a.id)).toEqual(expect.objectContaining({ id: a.id }));
      expect(await repository.findById(999)).toBeNull();
      expect(ids(await repository.findByIds([a.id, b.id]))).toEqual([a.id, b.id].sort());
      expect(ids(await repository.findByUserIds([b.user_id]))).toEqual([b.id]);
    });
  });

  describe("PrismaStaffSkillRepository", () => {
    const repository = new PrismaStaffSkillRepository();

    it("findSkillsByStaffIds returns skills tagged with their staff_id", async () => {
      const [s1, s2] = [await seed.seedStaff(), await seed.seedStaff()];
      const [k1, k2] = [await seed.seedSkill("Plumbing"), await seed.seedSkill("Painting")];
      await seed.seedStaffSkill(s1.id, k1.id);
      await seed.seedStaffSkill(s1.id, k2.id);
      await seed.seedStaffSkill(s2.id, k2.id);

      const skills = await repository.findSkillsByStaffIds([s1.id, s2.id]);

      expect(skills).toHaveLength(3);
      expect(skills).toEqual(
        expect.arrayContaining([
          { id: k1.id, name: "Plumbing", staff_id: s1.id },
          { id: k2.id, name: "Painting", staff_id: s1.id },
          { id: k2.id, name: "Painting", staff_id: s2.id },
        ]),
      );
      expect(await repository.findSkillsByStaffIds([999])).toEqual([]);
    });
  });

  describe("find-by-id use cases", () => {
    it("FindUserByIdUseCase throws ResourceNotFoundError for unknown ids", async () => {
      const useCase = new FindUserByIdUseCase(new PrismaUserRepository());
      await expect(useCase.handle(999)).rejects.toBeInstanceOf(ResourceNotFoundError);
    });

    it("FindStaffByIdUseCase returns the staff or throws", async () => {
      const staff = await seed.seedStaff();
      const useCase = new FindStaffByIdUseCase(new PrismaStaffRepository());
      await expect(useCase.handle(staff.id)).resolves.toEqual(expect.objectContaining({ id: staff.id }));
      await expect(useCase.handle(999)).rejects.toBeInstanceOf(ResourceNotFoundError);
    });
  });
});
```

- [ ] **Passo 3: Rodar e confirmar a falha**

Rode `npx vitest run test/repository/identity.repository.test.ts`. Esperado: FAIL, porque os módulos `@/use-cases/find-staff-by-id` e `@/use-cases/find-user-by-id` não existem.

- [ ] **Passo 4: Ajustar as entidades**

`src/entities/models/user.interface.ts`: o id no banco é `Int`, então troque `id?: string;` por:

```ts
  id?: number;
```

`src/entities/user.entity.ts`: troque `id?: string;` por `id?: number;`.

`src/entities/models/manager.interface.ts`:

```ts
export interface IManager {
  id?: number;
  name: string;
  phone: string;
  nif: string;
  user_id?: number;
}
```

`src/entities/models/staff-skill.interface.ts`: acrescente ao final (e importe `ISkill`):

```ts
import { ISkill } from "./skill.interface";

export interface IStaffSkill {
  id?: number;
  staff_id: number;
  skill_id: number;
}

export interface ISkillOfStaff extends ISkill {
  staff_id: number;
}
```

- [ ] **Passo 5: Repositório de usuário**

`src/repository/user.repository.interface.ts`: mantenha `findByUserId` por enquanto; ele ainda é usado pelo REST e sai na Task 7.

```ts
import { IManager } from "@/entities/models/manager.interface";
import { UserEntity } from "@/entities/user.entity";

export interface IUserRepository {
  create(user: UserEntity): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByUserId(user_id: number): Promise<(UserEntity & IManager) | undefined>;
  findById(id: number): Promise<UserEntity | null>;
  findByIds(ids: number[]): Promise<UserEntity[]>;
}
```

Em `src/repository/prisma/user.repository.ts`, adicione à classe:

```ts
  async findById(id: number): Promise<UserEntity | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByIds(ids: number[]): Promise<UserEntity[]> {
    return prisma.user.findMany({ where: { id: { in: ids } } });
  }
```

- [ ] **Passo 6: Repositório de manager**

`src/repository/manager.repository.interface.ts`:

```ts
import { IManager } from "@/entities/models/manager.interface";

export interface IManagerRepository {
  create(manager: IManager): Promise<IManager>;
  findWithManager(user_id: number): Promise<IManager | undefined>;
  findByIds(ids: number[]): Promise<IManager[]>;
  findByUserIds(user_ids: number[]): Promise<IManager[]>;
}
```

`src/repository/prisma/manager.repository.ts`: substitua o arquivo todo.

```ts
import { IManager } from "@/entities/models/manager.interface";
import { prisma } from "@/lib/prisma/db";
import { IManagerRepository } from "../manager.repository.interface";

export class PrismaManagerRepository implements IManagerRepository {
  async create(manager: IManager): Promise<IManager> {
    const createdManager = await prisma.manager.create({
      data: {
        name: manager.name,
        phone: manager.phone,
        nif: manager.nif,
        user_id: manager.user_id!,
      },
    });

    return createdManager;
  }

  async findWithManager(user_id: number): Promise<IManager | undefined> {
    const manager = await prisma.manager.findFirst({ where: { user_id } });
    return manager ?? undefined;
  }

  async findByIds(ids: number[]): Promise<IManager[]> {
    return prisma.manager.findMany({ where: { id: { in: ids } } });
  }

  async findByUserIds(user_ids: number[]): Promise<IManager[]> {
    return prisma.manager.findMany({ where: { user_id: { in: user_ids } } });
  }
}
```

`src/use-cases/find-with-manager.ts`:

```ts
import { IManager } from "@/entities/models/manager.interface";
import { ResourceNotFoundError } from "./errors/resource-not-found-erro";
import { IManagerRepository } from "@/repository/manager.repository.interface";

export class FindWithManagerUseCase {
  constructor(private readonly managerRepository: IManagerRepository) {}

  async handle(user_id: number): Promise<IManager> {
    const manager = await this.managerRepository.findWithManager(user_id);
    if (!manager) {
      throw new ResourceNotFoundError();
    }
    return manager;
  }
}
```

- [ ] **Passo 7: Repositório de staff**

`src/repository/staff.repository.interface.ts`:

```ts
import { IStaff } from "@/entities/models/staff.interface";

export interface IStaffRepository {
  create(staff: IStaff): Promise<IStaff>;
  findWithStaff(user_id: number): Promise<IStaff | undefined>;
  findById(id: number): Promise<IStaff | null>;
  findByIds(ids: number[]): Promise<IStaff[]>;
  findByUserIds(user_ids: number[]): Promise<IStaff[]>;
}
```

`src/repository/prisma/staff.repository.ts`: substitua o arquivo todo.

```ts
import { IStaff } from "@/entities/models/staff.interface";
import { prisma } from "@/lib/prisma/db";
import { IStaffRepository } from "../staff.repository.interface";

export class PrismaStaffRepository implements IStaffRepository {
  async create(staff: IStaff): Promise<IStaff> {
    const createdStaff = await prisma.staff.create({
      data: {
        name: staff.name,
        phone: staff.phone,
        nif: staff.nif,
        user_id: staff.user_id!,
      },
    });

    return createdStaff;
  }

  async findWithStaff(user_id: number): Promise<IStaff | undefined> {
    const staff = await prisma.staff.findFirst({ where: { user_id } });
    return staff ?? undefined;
  }

  async findById(id: number): Promise<IStaff | null> {
    return prisma.staff.findUnique({ where: { id } });
  }

  async findByIds(ids: number[]): Promise<IStaff[]> {
    return prisma.staff.findMany({ where: { id: { in: ids } } });
  }

  async findByUserIds(user_ids: number[]): Promise<IStaff[]> {
    return prisma.staff.findMany({ where: { user_id: { in: user_ids } } });
  }
}
```

`src/use-cases/find-with-staff.ts`:

```ts
import { IStaff } from "@/entities/models/staff.interface";
import { IStaffRepository } from "@/repository/staff.repository.interface";
import { ResourceNotFoundError } from "./errors/resource-not-found-erro";

export class FindWithStaffUseCase {
  constructor(private readonly staffRepository: IStaffRepository) {}

  async handle(user_id: number): Promise<IStaff> {
    const staff = await this.staffRepository.findWithStaff(user_id);

    if (!staff) {
      throw new ResourceNotFoundError();
    }

    return staff;
  }
}
```

- [ ] **Passo 8: Repositório de staff-skill**

`src/repository/staff-skill.repository.interface.ts`: mantenha `findSkillsByStaffId`, que sai na Task 7.

```ts
import { ISkill } from "@/entities/models/skill.interface";
import { ISkillOfStaff, IStaffSkill } from "@/entities/models/staff-skill.interface";

export interface IStaffSkillRepository {
  createSkill(skill: ISkill): Promise<ISkill>;
  addSkillToStaff(staffSkill: IStaffSkill): Promise<IStaffSkill>;
  findSkillsByStaffId(staff_id: number): Promise<ISkill[]>;
  findSkillsByStaffIds(staff_ids: number[]): Promise<ISkillOfStaff[]>;
}
```

Em `src/repository/prisma/staff-skill.repository.ts`, atualize o import para `import { ISkillOfStaff, IStaffSkill } from "@/entities/models/staff-skill.interface";` e adicione à classe:

```ts
  async findSkillsByStaffIds(staff_ids: number[]): Promise<ISkillOfStaff[]> {
    const relations = await prisma.staffSkill.findMany({
      where: { staff_id: { in: staff_ids } },
      include: { skill: true },
    });

    return relations.map((relation) => ({ ...relation.skill, staff_id: relation.staff_id }));
  }
```

- [ ] **Passo 9: Use cases de busca por id**

`src/use-cases/find-user-by-id.ts`:

```ts
import { UserEntity } from "@/entities/user.entity";
import { IUserRepository } from "@/repository/user.repository.interface";
import { ResourceNotFoundError } from "./errors/resource-not-found-erro";

export class FindUserByIdUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new ResourceNotFoundError();
    }

    return user;
  }
}
```

`src/use-cases/find-staff-by-id.ts`:

```ts
import { IStaff } from "@/entities/models/staff.interface";
import { IStaffRepository } from "@/repository/staff.repository.interface";
import { ResourceNotFoundError } from "./errors/resource-not-found-erro";

export class FindStaffByIdUseCase {
  constructor(private readonly staffRepository: IStaffRepository) {}

  async handle(id: number): Promise<IStaff> {
    const staff = await this.staffRepository.findById(id);

    if (!staff) {
      throw new ResourceNotFoundError();
    }

    return staff;
  }
}
```

`src/use-cases/factory/user/make-find-user-by-id-usecase.ts`:

```ts
import { PrismaUserRepository } from "@/repository/prisma/user.repository";
import { FindUserByIdUseCase } from "@/use-cases/find-user-by-id";

export function makeFindUserByIdUseCase() {
  const userRepository = new PrismaUserRepository();
  const findUserByIdUseCase = new FindUserByIdUseCase(userRepository);
  return findUserByIdUseCase;
}
```

`src/use-cases/factory/staff/make-find-staff-by-id-usecase.ts`:

```ts
import { PrismaStaffRepository } from "@/repository/prisma/staff.repository";
import { FindStaffByIdUseCase } from "@/use-cases/find-staff-by-id";

export function makeFindStaffByIdUseCase() {
  const staffRepository = new PrismaStaffRepository();
  const findStaffByIdUseCase = new FindStaffByIdUseCase(staffRepository);
  return findStaffByIdUseCase;
}
```

- [ ] **Passo 10: Rodar os testes**

Rode `npm test`. Esperado: todos passam (infra + identity).

- [ ] **Passo 11: Verificar tipos e lint**

Rode `npx tsc --noEmit && npm run lint`. Esperado: sem erros.

Se `tsc` acusar o uso de `user.id` como string em algum controller REST, ajuste a conversão (`String(user.id)` já funciona com number).

- [ ] **Passo 12: Commit**

```bash
git add src test
git commit -m "Add batch lookup methods to identity repositories and stop merging user into manager/staff

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Repositórios de domínio (condomínio, serviço, foto, checklist)

**Arquivos:**
- Modificar: `src/entities/models/check-list.interface.ts`, `src/entities/models/condominium.interface.ts`
- Modificar: `src/repository/condominium.repository.interface.ts`, `src/repository/service.repository.interface.ts`, `src/repository/photo-service.repository.interface.ts`, `src/repository/check-list.repository.interface.ts` e as implementações Prisma
- Criar: `src/use-cases/find-condominium-by-id.ts`, `src/use-cases/find-service-by-id.ts`, `src/use-cases/factory/condominium/make-find-by-id-usecase.ts`, `src/use-cases/factory/service/make-find-by-id-usecase.ts`
- Teste: `test/repository/domain.repository.test.ts`

**Interfaces:**
- Consome: `seed*` (Task 2), `resetDb` (Task 1).
- Produz:
  - `ICheckList.created_at?: Date`
  - `ICondominiumOfManager extends ICondominium { manager_id: number }` (em `condominium.interface.ts`)
  - `ICondominiumRepository.findById(id: number): Promise<ICondominium | null>`, `findByIds(ids: number[]): Promise<ICondominium[]>`, `findByManagerIds(manager_ids: number[]): Promise<ICondominiumOfManager[]>`
  - `IServiceRepository.findById(id: string): Promise<IService | null>`, `findByCondominiumIds(ids: number[]): Promise<IService[]>`, `findByStaffIds(ids: number[]): Promise<IService[]>`
  - `IPhotoServiceRepository.findByServiceIds(ids: string[]): Promise<IPhotoService[]>`
  - `ICheckListRepository.findByServiceIds(ids: string[]): Promise<ICheckListWithItems[]>`
  - `FindCondominiumByIdUseCase.handle(id: number): Promise<ICondominium>` e `FindServiceByIdUseCase.handle(id: string): Promise<IService>`, ambos lançando `ResourceNotFoundError`; factories `makeFindCondominiumByIdUseCase()` e `makeFindServiceByIdUseCase()`

- [ ] **Passo 1: Escrever o teste que falha**

`test/repository/domain.repository.test.ts`:

```ts
import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { PrismaCheckListRepository } from "@/repository/prisma/check-list.repository";
import { PrismaCondominiumRepository } from "@/repository/prisma/condominium.repository";
import { PrismaPhotoServiceRepository } from "@/repository/prisma/photo-service.repository";
import { PrismaServiceRepository } from "@/repository/prisma/service.repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-erro";
import { FindCondominiumByIdUseCase } from "@/use-cases/find-condominium-by-id";
import { FindServiceByIdUseCase } from "@/use-cases/find-service-by-id";
import * as seed from "../helpers/factories";
import { resetDb } from "../helpers/reset-db";

describe("domain repositories", () => {
  beforeEach(resetDb);

  describe("PrismaCondominiumRepository", () => {
    const repository = new PrismaCondominiumRepository();

    it("findById returns the condominium with manager_ids, or null", async () => {
      const [m1, m2] = [await seed.seedManager(), await seed.seedManager()];
      const condo = await seed.seedCondominium([m1.id, m2.id], { name: "Alpha" });

      const found = await repository.findById(condo.id);

      expect(found).toEqual(expect.objectContaining({ id: condo.id, name: "Alpha" }));
      expect(found?.manager_ids.sort()).toEqual([m1.id, m2.id].sort());
      expect(await repository.findById(999)).toBeNull();
    });

    it("findByIds batch-loads condominiums", async () => {
      const m = await seed.seedManager();
      const [c1, c2] = [await seed.seedCondominium([m.id]), await seed.seedCondominium([m.id])];
      await seed.seedCondominium([m.id]);

      const found = await repository.findByIds([c1.id, c2.id, 999]);

      expect(found.map((c) => c.id).sort()).toEqual([c1.id, c2.id].sort());
      expect(found[0].manager_ids).toEqual([m.id]);
    });

    it("findByManagerIds returns one row per (condominium, manager) pair", async () => {
      const [m1, m2] = [await seed.seedManager(), await seed.seedManager()];
      const shared = await seed.seedCondominium([m1.id, m2.id]);
      const onlyM1 = await seed.seedCondominium([m1.id]);

      const rows = await repository.findByManagerIds([m1.id, m2.id]);

      expect(rows.map((r) => [r.id, r.manager_id])).toEqual(
        expect.arrayContaining([
          [shared.id, m1.id],
          [shared.id, m2.id],
          [onlyM1.id, m1.id],
        ]),
      );
      expect(rows).toHaveLength(3);
      expect(await repository.findByManagerIds([999])).toEqual([]);
    });
  });

  describe("PrismaServiceRepository", () => {
    const repository = new PrismaServiceRepository();

    it("create keeps dates and decimal price intact", async () => {
      const m = await seed.seedManager();
      const condo = await seed.seedCondominium([m.id]);
      const staff = await seed.seedStaff();

      const created = await repository.create({
        condominium_id: condo.id,
        staff_id: staff.id,
        description: "Fix roof",
        start_date: "2026-01-31",
        end_date: "2026-02-01",
        status: "pending",
        price: 10.5,
      });

      const found = await repository.findById(created.id!);
      expect(found).toEqual(
        expect.objectContaining({ start_date: "2026-01-31", end_date: "2026-02-01", price: 10.5 }),
      );
    });

    it("findById returns null for unknown ids", async () => {
      expect(await repository.findById(randomUUID())).toBeNull();
    });

    it("findByCondominiumIds and findByStaffIds batch-load services", async () => {
      const m = await seed.seedManager();
      const [c1, c2] = [await seed.seedCondominium([m.id]), await seed.seedCondominium([m.id])];
      const [s1, s2] = [await seed.seedStaff(), await seed.seedStaff()];
      const a = await seed.seedService(c1.id, s1.id);
      const b = await seed.seedService(c2.id, s2.id);
      const c = await seed.seedService(c2.id, s1.id);

      const byCondo = await repository.findByCondominiumIds([c1.id, c2.id]);
      const byStaff = await repository.findByStaffIds([s1.id]);

      expect(byCondo.map((s) => s.id).sort()).toEqual([a.id, b.id, c.id].sort());
      expect(byStaff.map((s) => s.id).sort()).toEqual([a.id, c.id].sort());
      expect(byStaff[0]).toEqual(expect.objectContaining({ staff_id: s1.id, start_date: "2026-01-10", price: 100 }));
      expect(await repository.findByCondominiumIds([999])).toEqual([]);
    });
  });

  describe("photo and check list repositories", () => {
    it("findByServiceIds batch-loads photos and check lists with items", async () => {
      const m = await seed.seedManager();
      const condo = await seed.seedCondominium([m.id]);
      const staff = await seed.seedStaff();
      const [sv1, sv2] = [await seed.seedService(condo.id, staff.id), await seed.seedService(condo.id, staff.id)];
      await seed.seedPhoto(sv1.id);
      await seed.seedPhoto(sv2.id);
      const list = await seed.seedCheckList(sv1.id);
      await seed.seedCheckListItem(list.id, { completed: true });
      await seed.seedCheckListItem(list.id);

      const photos = await new PrismaPhotoServiceRepository().findByServiceIds([sv1.id, sv2.id]);
      const lists = await new PrismaCheckListRepository().findByServiceIds([sv1.id, sv2.id]);

      expect(photos.map((p) => p.service_id).sort()).toEqual([sv1.id, sv2.id].sort());
      expect(lists).toHaveLength(1);
      expect(lists[0]).toEqual(expect.objectContaining({ id: list.id, service_id: sv1.id }));
      expect(lists[0].created_at).toBeInstanceOf(Date);
      expect(lists[0].items.map((i) => i.completed).sort()).toEqual([false, true]);
    });
  });

  describe("find-by-id use cases", () => {
    it("throw ResourceNotFoundError for unknown ids", async () => {
      await expect(
        new FindCondominiumByIdUseCase(new PrismaCondominiumRepository()).handle(999),
      ).rejects.toBeInstanceOf(ResourceNotFoundError);
      await expect(
        new FindServiceByIdUseCase(new PrismaServiceRepository()).handle(randomUUID()),
      ).rejects.toBeInstanceOf(ResourceNotFoundError);
    });
  });
});
```

- [ ] **Passo 2: Rodar e confirmar a falha**

Rode `npx vitest run test/repository/domain.repository.test.ts`. Esperado: FAIL, porque `@/use-cases/find-condominium-by-id` não existe.

- [ ] **Passo 3: Ajustar as entidades**

`src/entities/models/check-list.interface.ts`:

```ts
import { ICheckListItem } from "./check-list-item.interface";

export interface ICheckList {
  id?: number;
  service_id: string;
  description: string;
  created_at?: Date;
}

export interface ICheckListWithItems extends ICheckList {
  items: ICheckListItem[];
}
```

`src/entities/models/condominium.interface.ts`: acrescente ao final.

```ts
export interface ICondominiumOfManager extends ICondominium {
  manager_id: number;
}
```

- [ ] **Passo 4: Repositório de condomínio**

`src/repository/condominium.repository.interface.ts`:

```ts
import { ICondominium, ICondominiumOfManager } from "@/entities/models/condominium.interface";

export interface ICondominiumRepository {
  create(condominium: ICondominium): Promise<ICondominium>;
  findAll(): Promise<ICondominium[]>;
  findById(id: number): Promise<ICondominium | null>;
  findByIds(ids: number[]): Promise<ICondominium[]>;
  findByManagerIds(manager_ids: number[]): Promise<ICondominiumOfManager[]>;
}
```

`src/repository/prisma/condominium.repository.ts`: substitua o arquivo todo. O mapeamento repetido vira `toCondominium`.

```ts
import { Prisma } from "@prisma/client";
import { ICondominium, ICondominiumOfManager } from "@/entities/models/condominium.interface";
import { prisma } from "@/lib/prisma/db";
import { ICondominiumRepository } from "../condominium.repository.interface";

const withManagerIds = {
  managers: {
    select: {
      manager_id: true,
    },
  },
} satisfies Prisma.CondominiumInclude;

type CondominiumRow = Prisma.CondominiumGetPayload<{ include: typeof withManagerIds }>;

function toCondominium(condominium: CondominiumRow): ICondominium {
  return {
    id: condominium.id,
    name: condominium.name,
    address: condominium.address,
    city: condominium.city,
    state: condominium.state,
    zip: condominium.zip,
    country: condominium.country,
    manager_ids: condominium.managers.map((manager) => manager.manager_id),
  };
}

export class PrismaCondominiumRepository implements ICondominiumRepository {
  async create(condominium: ICondominium): Promise<ICondominium> {
    const createdCondominium = await prisma.condominium.create({
      data: {
        name: condominium.name,
        address: condominium.address,
        city: condominium.city,
        state: condominium.state,
        zip: condominium.zip,
        country: condominium.country,
        managers: {
          create: condominium.manager_ids.map((managerId) => ({
            manager_id: managerId,
          })),
        },
      },
      include: withManagerIds,
    });

    return toCondominium(createdCondominium);
  }

  async findAll(): Promise<ICondominium[]> {
    const condominiums = await prisma.condominium.findMany({ include: withManagerIds });
    return condominiums.map(toCondominium);
  }

  async findById(id: number): Promise<ICondominium | null> {
    const condominium = await prisma.condominium.findUnique({ where: { id }, include: withManagerIds });
    return condominium ? toCondominium(condominium) : null;
  }

  async findByIds(ids: number[]): Promise<ICondominium[]> {
    const condominiums = await prisma.condominium.findMany({
      where: { id: { in: ids } },
      include: withManagerIds,
    });
    return condominiums.map(toCondominium);
  }

  async findByManagerIds(manager_ids: number[]): Promise<ICondominiumOfManager[]> {
    const relations = await prisma.condominiumManager.findMany({
      where: { manager_id: { in: manager_ids } },
      include: { condominium: { include: withManagerIds } },
    });

    return relations.map((relation) => ({
      ...toCondominium(relation.condominium),
      manager_id: relation.manager_id,
    }));
  }
}
```

- [ ] **Passo 5: Repositório de serviço**

`src/repository/service.repository.interface.ts`: mantenha `findByCondominiumId`, que sai na Task 7.

```ts
import { IService } from "@/entities/models/service.interface";

export interface IServiceRepository {
  create(service: IService): Promise<IService>;
  findByCondominiumId(condominium_id: number): Promise<IService[]>;
  findById(id: string): Promise<IService | null>;
  findByCondominiumIds(condominium_ids: number[]): Promise<IService[]>;
  findByStaffIds(staff_ids: number[]): Promise<IService[]>;
}
```

`src/repository/prisma/service.repository.ts`: substitua o arquivo todo.

```ts
import { randomUUID } from "node:crypto";
import { Prisma, Service as ServiceRow } from "@prisma/client";
import { IService } from "@/entities/models/service.interface";
import { prisma } from "@/lib/prisma/db";
import { IServiceRepository } from "../service.repository.interface";

function toService(service: ServiceRow): IService {
  return {
    id: service.id,
    condominium_id: service.condominium_id,
    staff_id: service.staff_id,
    description: service.description,
    start_date: service.start_date.toISOString().slice(0, 10),
    end_date: service.end_date.toISOString().slice(0, 10),
    status: service.status,
    price: Number(service.price),
  };
}

export class PrismaServiceRepository implements IServiceRepository {
  async create(service: IService): Promise<IService> {
    const createdService = await prisma.service.create({
      data: {
        id: randomUUID(),
        condominium_id: service.condominium_id,
        staff_id: service.staff_id,
        description: service.description,
        start_date: new Date(service.start_date),
        end_date: new Date(service.end_date),
        status: service.status,
        price: new Prisma.Decimal(service.price),
      },
    });

    return toService(createdService);
  }

  async findByCondominiumId(condominium_id: number): Promise<IService[]> {
    const services = await prisma.service.findMany({ where: { condominium_id } });
    return services.map(toService);
  }

  async findById(id: string): Promise<IService | null> {
    const service = await prisma.service.findUnique({ where: { id } });
    return service ? toService(service) : null;
  }

  async findByCondominiumIds(condominium_ids: number[]): Promise<IService[]> {
    const services = await prisma.service.findMany({ where: { condominium_id: { in: condominium_ids } } });
    return services.map(toService);
  }

  async findByStaffIds(staff_ids: number[]): Promise<IService[]> {
    const services = await prisma.service.findMany({ where: { staff_id: { in: staff_ids } } });
    return services.map(toService);
  }
}
```

- [ ] **Passo 6: Repositórios de foto e checklist**

`src/repository/photo-service.repository.interface.ts`: mantenha `findByServiceId`, que sai na Task 7.

```ts
import { IPhotoService } from "@/entities/models/photo-service.interface";

export interface IPhotoServiceRepository {
  create(photoService: IPhotoService): Promise<IPhotoService>;
  findByServiceId(service_id: string): Promise<IPhotoService[]>;
  findByServiceIds(service_ids: string[]): Promise<IPhotoService[]>;
}
```

Em `src/repository/prisma/photo-service.repository.ts`, adicione à classe:

```ts
  async findByServiceIds(service_ids: string[]): Promise<IPhotoService[]> {
    return prisma.photoService.findMany({
      where: { service_id: { in: service_ids } },
    });
  }
```

`src/repository/check-list.repository.interface.ts`: mantenha `findByServiceId`, que sai na Task 7.

```ts
import { ICheckList, ICheckListWithItems } from "@/entities/models/check-list.interface";

export interface ICheckListRepository {
  create(checkList: ICheckList): Promise<ICheckList>;
  findByServiceId(service_id: string): Promise<ICheckListWithItems[]>;
  findByServiceIds(service_ids: string[]): Promise<ICheckListWithItems[]>;
}
```

Em `src/repository/prisma/check-list.repository.ts`, adicione à classe:

```ts
  async findByServiceIds(service_ids: string[]): Promise<ICheckListWithItems[]> {
    return prisma.checkList.findMany({
      where: { service_id: { in: service_ids } },
      include: { items: true },
    });
  }
```

- [ ] **Passo 7: Use cases de busca por id**

`src/use-cases/find-condominium-by-id.ts`:

```ts
import { ICondominium } from "@/entities/models/condominium.interface";
import { ICondominiumRepository } from "@/repository/condominium.repository.interface";
import { ResourceNotFoundError } from "./errors/resource-not-found-erro";

export class FindCondominiumByIdUseCase {
  constructor(private readonly condominiumRepository: ICondominiumRepository) {}

  async handle(id: number): Promise<ICondominium> {
    const condominium = await this.condominiumRepository.findById(id);

    if (!condominium) {
      throw new ResourceNotFoundError();
    }

    return condominium;
  }
}
```

`src/use-cases/find-service-by-id.ts`:

```ts
import { IService } from "@/entities/models/service.interface";
import { IServiceRepository } from "@/repository/service.repository.interface";
import { ResourceNotFoundError } from "./errors/resource-not-found-erro";

export class FindServiceByIdUseCase {
  constructor(private readonly serviceRepository: IServiceRepository) {}

  async handle(id: string): Promise<IService> {
    const service = await this.serviceRepository.findById(id);

    if (!service) {
      throw new ResourceNotFoundError();
    }

    return service;
  }
}
```

`src/use-cases/factory/condominium/make-find-by-id-usecase.ts`:

```ts
import { PrismaCondominiumRepository } from "@/repository/prisma/condominium.repository";
import { FindCondominiumByIdUseCase } from "@/use-cases/find-condominium-by-id";

export function makeFindCondominiumByIdUseCase() {
  const condominiumRepository = new PrismaCondominiumRepository();
  const findCondominiumByIdUseCase = new FindCondominiumByIdUseCase(condominiumRepository);
  return findCondominiumByIdUseCase;
}
```

`src/use-cases/factory/service/make-find-by-id-usecase.ts`:

```ts
import { PrismaServiceRepository } from "@/repository/prisma/service.repository";
import { FindServiceByIdUseCase } from "@/use-cases/find-service-by-id";

export function makeFindServiceByIdUseCase() {
  const serviceRepository = new PrismaServiceRepository();
  const findServiceByIdUseCase = new FindServiceByIdUseCase(serviceRepository);
  return findServiceByIdUseCase;
}
```

- [ ] **Passo 8: Rodar testes, tipos e lint**

Rode `npm test && npx tsc --noEmit && npm run lint`. Esperado: tudo verde.

- [ ] **Passo 9: Commit**

```bash
git add src test
git commit -m "Add batch lookup methods to condominium, service, photo and check list repositories

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Núcleo GraphQL, autenticação e usuário

**Arquivos:**
- Criar: `src/lib/jwt.ts`, `src/graphql/builder.ts`, `src/graphql/context.ts`, `src/graphql/refs.ts`, `src/graphql/errors.ts`, `src/graphql/server.ts`, `src/graphql/schema.ts`, `src/graphql/utils/order-by-keys.ts`, `src/graphql/modules/auth.ts`, `src/graphql/modules/user.ts`
- Criar: `src/use-cases/authenticate.ts`, `src/use-cases/errors/invalid-credentials-error.ts`, `src/use-cases/factory/auth/make-authenticate-usecase.ts`
- Modificar: `src/app.ts`, `src/server.ts`, `package.json`
- Criar: `test/helpers/graphql.ts`
- Teste: `test/graphql/order-by-keys.test.ts`, `test/graphql/context.test.ts`, `test/graphql/auth.test.ts`, `test/graphql/http.test.ts`

**Interfaces:**
- Consome: `UserEntity` (`id: number`), `IUserRepository.findById`, `makeFindUserByIdUseCase()`, `makeCreateUserUseCase()`, `makeFindUserUseCase()`, `seedUser`, `DEFAULT_PASSWORD`.
- Produz:
  - `signToken(user: { id: number; type: string }): string`, `verifyToken(token: string): number | null`
  - `type Context = { userId: number | null }`, `buildContext(authorization: string | undefined): Context`
  - `builder`: `SchemaBuilder` com `AuthScopes: { authenticated: boolean }`. Query e Mutation são privados por padrão; campos públicos usam `skipTypeScopes: true`.
  - `refs.ts`: `User`, `AuthPayload`, `UserType` (as tasks 5 e 6 acrescentam refs)
  - `orderByKeys(keys, rows, keyOf): (T | null)[]` e `orderByKeysOrError(keys, rows, keyOf): (T | Error)[]`
  - `formatError(formattedError, error): GraphQLFormattedError`
  - `createApolloServer(): ApolloServer<Context>`, `MAX_QUERY_DEPTH = 7`
  - `createApp(): Promise<Express>`
  - `test/helpers/graphql.ts`: `execute(query, variables?, token?)` → `{ data, errors }`; `tokenFor(user)`
  - GraphQL: `Query.me`, `Query.user(email)`, `Mutation.login(input)`, `Mutation.createUser(input)`, tipos `User`, `AuthPayload`, enum `UserType`

- [ ] **Passo 1: Instalar as dependências GraphQL**

```bash
npm i @apollo/server@5.5.1 @as-integrations/express5@1.1.2 graphql@16.14.2 @pothos/core@4.15.1 @pothos/plugin-scope-auth@4.2.1 @pothos/plugin-validation@4.3.4 @pothos/plugin-dataloader@4.4.6 dataloader@2.2.3 graphql-depth-limit@1.1.0
npm i -D @types/graphql-depth-limit@1.1.6
```

- [ ] **Passo 2: Escrever os testes que falham**

`test/helpers/graphql.ts`:

```ts
import { ApolloServer } from "@apollo/server";
import { buildContext, Context } from "@/graphql/context";
import { createApolloServer } from "@/graphql/server";
import { signToken } from "@/lib/jwt";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Data = Record<string, any>;

let server: ApolloServer<Context> | undefined;

export async function execute(query: string, variables: Record<string, unknown> = {}, token?: string) {
  server ??= createApolloServer();
  const response = await server.executeOperation<Data>(
    { query, variables },
    { contextValue: buildContext(token ? `Bearer ${token}` : undefined) },
  );

  if (response.body.kind !== "single") {
    throw new Error("Expected a single GraphQL result");
  }

  return response.body.singleResult;
}

export function tokenFor(user: { id: number; type: string }) {
  return signToken(user);
}
```

`test/graphql/order-by-keys.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { orderByKeys, orderByKeysOrError } from "@/graphql/utils/order-by-keys";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-erro";

const rows = [{ id: 3 }, { id: 1 }];

describe("orderByKeys", () => {
  it("returns rows in key order with null for missing keys", () => {
    expect(orderByKeys([1, 2, 3], rows, (row) => row.id)).toEqual([{ id: 1 }, null, { id: 3 }]);
  });

  it("orderByKeysOrError returns ResourceNotFoundError for missing keys", () => {
    const result = orderByKeysOrError([1, 2], rows, (row) => row.id);
    expect(result[0]).toEqual({ id: 1 });
    expect(result[1]).toBeInstanceOf(ResourceNotFoundError);
  });
});
```

`test/graphql/context.test.ts` (Review Focus 2):

```ts
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { buildContext } from "@/graphql/context";
import { signToken } from "@/lib/jwt";

describe("buildContext", () => {
  const secret = process.env.JWT_SECRET!;

  it("extracts the user id from a valid Bearer token", () => {
    expect(buildContext(`Bearer ${signToken({ id: 42, type: "Manager" })}`)).toEqual({ userId: 42 });
  });

  it.each([
    ["missing header", undefined],
    ["empty header", ""],
    ["wrong scheme", `Basic ${signToken({ id: 1, type: "Manager" })}`],
    ["Bearer without token", "Bearer"],
    ["malformed token", "Bearer not-a-jwt"],
    ["wrong secret", `Bearer ${jwt.sign({}, "other-secret", { subject: "1" })}`],
    ["expired token", `Bearer ${jwt.sign({}, secret, { subject: "1", expiresIn: -10 })}`],
    ["non-numeric subject", `Bearer ${jwt.sign({}, secret, { subject: "abc" })}`],
  ])("returns userId null for %s", (_label, header) => {
    expect(buildContext(header)).toEqual({ userId: null });
  });
});
```

`test/graphql/auth.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma/db";
import * as seed from "../helpers/factories";
import { execute, tokenFor } from "../helpers/graphql";
import { resetDb } from "../helpers/reset-db";

const CREATE_USER = /* GraphQL */ `
  mutation ($input: CreateUserInput!) {
    createUser(input: $input) { id name email type }
  }
`;

const LOGIN = /* GraphQL */ `
  mutation ($input: LoginInput!) {
    login(input: $input) { token user { id email } }
  }
`;

const ME = /* GraphQL */ `
  query { me { id name email type } }
`;

const validUser = { name: "Ana", email: "ana@test.com", password: "password123", type: "Manager" };

describe("auth and user", () => {
  beforeEach(resetDb);

  it("createUser works without a token and never exposes password", async () => {
    const result = await execute(CREATE_USER, { input: validUser });

    expect(result.errors).toBeUndefined();
    expect(result.data?.createUser).toEqual({ id: expect.any(Number), name: "Ana", email: "ana@test.com", type: "Manager" });

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: "ana@test.com" } });
    expect(stored.password).not.toBe("password123");

    const introspection = await execute(`{ __type(name: "User") { fields { name } } }`);
    const fieldNames = introspection.data?.__type.fields.map((f: { name: string }) => f.name);
    expect(fieldNames).not.toContain("password");
  });

  it("createUser rejects invalid input with BAD_USER_INPUT without touching the database", async () => {
    const result = await execute(CREATE_USER, { input: { ...validUser, email: "not-an-email" } });

    expect(result.errors?.[0].extensions?.code).toBe("BAD_USER_INPUT");
    await expect(prisma.user.count()).resolves.toBe(0);
  });

  it("createUser rejects short passwords with BAD_USER_INPUT", async () => {
    const result = await execute(CREATE_USER, { input: { ...validUser, password: "short" } });
    expect(result.errors?.[0].extensions?.code).toBe("BAD_USER_INPUT");
  });

  it("createUser with a duplicate email returns BAD_USER_INPUT", async () => {
    await execute(CREATE_USER, { input: validUser });
    const result = await execute(CREATE_USER, { input: validUser });

    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({ message: "Resource already exists", extensions: expect.objectContaining({ code: "BAD_USER_INPUT" }) }),
    );
  });

  it("login with wrong credentials returns UNAUTHENTICATED", async () => {
    await seed.seedUser({ email: "ana@test.com" });

    for (const input of [
      { email: "ana@test.com", password: "wrong-password" },
      { email: "nobody@test.com", password: seed.DEFAULT_PASSWORD },
    ]) {
      const result = await execute(LOGIN, { input });
      expect(result.errors?.[0]).toEqual(
        expect.objectContaining({ message: "Invalid credentials", extensions: expect.objectContaining({ code: "UNAUTHENTICATED" }) }),
      );
    }
  });

  it("login returns a token that authenticates me", async () => {
    const user = await seed.seedUser({ email: "ana@test.com", name: "Ana" });

    const login = await execute(LOGIN, { input: { email: "ana@test.com", password: seed.DEFAULT_PASSWORD } });
    expect(login.errors).toBeUndefined();
    expect(login.data?.login.user).toEqual({ id: user.id, email: "ana@test.com" });

    const me = await execute(ME, {}, login.data?.login.token);
    expect(me.errors).toBeUndefined();
    expect(me.data?.me).toEqual({ id: user.id, name: "Ana", email: "ana@test.com", type: "Manager" });
  });

  it("me without a token returns UNAUTHENTICATED", async () => {
    const result = await execute(ME);
    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({ message: "Not authenticated", extensions: expect.objectContaining({ code: "UNAUTHENTICATED" }) }),
    );
  });

  it("me for a token whose user no longer exists returns NOT_FOUND", async () => {
    const result = await execute(ME, {}, tokenFor({ id: 999, type: "Manager" }));
    expect(result.errors?.[0].extensions?.code).toBe("NOT_FOUND");
  });

  it("user(email) returns the user or null", async () => {
    const viewer = await seed.seedUser();
    await seed.seedUser({ email: "bia@test.com", name: "Bia" });
    const query = `query ($email: String!) { user(email: $email) { name } }`;

    expect((await execute(query, { email: "bia@test.com" }, tokenFor(viewer))).data?.user).toEqual({ name: "Bia" });
    expect((await execute(query, { email: "none@test.com" }, tokenFor(viewer))).data?.user).toBeNull();
    expect((await execute(query, { email: "bad" }, tokenFor(viewer))).errors?.[0].extensions?.code).toBe("BAD_USER_INPUT");
  });
});
```

`test/graphql/http.test.ts`: confirma que o Express repassa o header para o context.

```ts
import { AddressInfo } from "node:net";
import { Server } from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "@/app";
import * as seed from "../helpers/factories";
import { tokenFor } from "../helpers/graphql";
import { resetDb } from "../helpers/reset-db";

let server: Server;
let url: string;

async function post(body: unknown, headers: Record<string, string> = {}) {
  const response = await fetch(`${url}/graphql`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

describe("HTTP /graphql", () => {
  beforeAll(async () => {
    const app = await createApp();
    server = app.listen(0);
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  beforeEach(resetDb);

  it("reads the Authorization header into the context", async () => {
    const user = await seed.seedUser({ name: "Ana" });

    const anonymous = await post({ query: "{ me { name } }" });
    expect(anonymous.body.errors[0].extensions.code).toBe("UNAUTHENTICATED");

    const authenticated = await post({ query: "{ me { name } }" }, { authorization: `Bearer ${tokenFor(user)}` });
    expect(authenticated.body).toEqual({ data: { me: { name: "Ana" } } });
  });
});
```

- [ ] **Passo 3: Rodar e confirmar a falha**

Rode `npx vitest run test/graphql`. Esperado: FAIL, porque `@/graphql/context` e os outros módulos novos não existem.

- [ ] **Passo 4: Criar `src/lib/jwt.ts`**

A assinatura segue a do `login.ts` atual.

```ts
import jwt from "jsonwebtoken";
import { env } from "@/env";

type TokenPayload = {
  sub: string;
};

export function signToken(user: { id: number; type: string }): string {
  return jwt.sign({ type: user.type }, env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: "1d",
  });
}

export function verifyToken(token: string): number | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    const userId = Number(decoded.sub);
    return Number.isInteger(userId) ? userId : null;
  } catch {
    return null;
  }
}
```

- [ ] **Passo 5: Criar `src/graphql/context.ts`**

```ts
import { verifyToken } from "@/lib/jwt";

export type Context = {
  userId: number | null;
};

export function buildContext(authorization: string | undefined): Context {
  if (!authorization) {
    return { userId: null };
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return { userId: null };
  }

  return { userId: verifyToken(token) };
}
```

- [ ] **Passo 6: Criar `src/graphql/builder.ts`**

O `ScopeAuthPlugin` vem primeiro na lista de plugins, como recomenda o Pothos.

```ts
import SchemaBuilder from "@pothos/core";
import DataloaderPlugin from "@pothos/plugin-dataloader";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import ValidationPlugin from "@pothos/plugin-validation";
import { GraphQLError } from "graphql";
import { Context } from "./context";

export const builder = new SchemaBuilder<{
  Context: Context;
  AuthScopes: {
    authenticated: boolean;
  };
}>({
  plugins: [ScopeAuthPlugin, ValidationPlugin, DataloaderPlugin],
  scopeAuth: {
    authScopes: async (context) => ({
      authenticated: context.userId !== null,
    }),
    unauthorizedError: () =>
      new GraphQLError("Not authenticated", { extensions: { code: "UNAUTHENTICATED" } }),
  },
});

// Every Query/Mutation field requires a logged-in user unless it sets `skipTypeScopes: true`.
builder.queryType({ authScopes: { authenticated: true } });
builder.mutationType({ authScopes: { authenticated: true } });
```

- [ ] **Passo 7: Criar `src/graphql/refs.ts`**

```ts
import { UserEntity } from "@/entities/user.entity";
import { builder } from "./builder";

export const UserType = builder.enumType("UserType", {
  values: ["Manager", "Staff"] as const,
});

export const User = builder.objectRef<UserEntity>("User");

export const AuthPayload = builder.objectRef<{ token: string; user: UserEntity }>("AuthPayload");
```

- [ ] **Passo 8: Criar `src/graphql/utils/order-by-keys.ts`**

```ts
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-erro";

// DataLoader batch functions must return one result per key, in key order.
export function orderByKeys<K, T>(keys: readonly K[], rows: T[], keyOf: (row: T) => K): (T | null)[] {
  const rowsByKey = new Map(rows.map((row) => [keyOf(row), row]));
  return keys.map((key) => rowsByKey.get(key) ?? null);
}

export function orderByKeysOrError<K, T>(keys: readonly K[], rows: T[], keyOf: (row: T) => K): (T | Error)[] {
  return orderByKeys(keys, rows, keyOf).map((row) => row ?? new ResourceNotFoundError());
}
```

- [ ] **Passo 9: Criar o erro de credenciais e o `AuthenticateUseCase`**

`src/use-cases/errors/invalid-credentials-error.ts`:

```ts
export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid credentials");
  }
}
```

`src/use-cases/authenticate.ts`:

```ts
import { compare } from "bcryptjs";
import { UserEntity } from "@/entities/user.entity";
import { IUserRepository } from "@/repository/user.repository.interface";
import { InvalidCredentialsError } from "./errors/invalid-credentials-error";

export class AuthenticateUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(email: string, password: string): Promise<UserEntity> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const doesPasswordMatch = await compare(password, user.password);

    if (!doesPasswordMatch) {
      throw new InvalidCredentialsError();
    }

    return user;
  }
}
```

`src/use-cases/factory/auth/make-authenticate-usecase.ts`:

```ts
import { PrismaUserRepository } from "@/repository/prisma/user.repository";
import { AuthenticateUseCase } from "@/use-cases/authenticate";

export function makeAuthenticateUseCase() {
  const userRepository = new PrismaUserRepository();
  const authenticateUseCase = new AuthenticateUseCase(userRepository);
  return authenticateUseCase;
}
```

- [ ] **Passo 10: Criar `src/graphql/errors.ts`**

Segue o padrão `errorHandlerMap` por `constructor.name` do `global-error-handler.ts`.

```ts
import { unwrapResolverError } from "@apollo/server/errors";
import { GraphQLFormattedError } from "graphql";
import { env } from "@/env";

type HandledError = {
  code: string;
  message: string;
};

const prismaErrorMap: Record<string, HandledError> = {
  P2002: { code: "BAD_USER_INPUT", message: "Resource already exists" },
  P2003: { code: "BAD_USER_INPUT", message: "Related resource not found" },
};

const errorHandlerMap: Record<string, (error: Error) => HandledError | undefined> = {
  ResourceNotFoundError: (error) => ({ code: "NOT_FOUND", message: error.message }),
  InvalidCredentialsError: (error) => ({ code: "UNAUTHENTICATED", message: error.message }),
  InputValidationError: (error) => ({ code: "BAD_USER_INPUT", message: error.message }),
  ZodError: (error) => ({ code: "BAD_USER_INPUT", message: error.message }),
  PrismaClientKnownRequestError: (error) => prismaErrorMap[(error as Error & { code: string }).code],
};

export function formatError(formattedError: GraphQLFormattedError, error: unknown): GraphQLFormattedError {
  const code = formattedError.extensions?.code;

  // Errors that already carry a meaningful code (auth scopes, GraphQL validation, parse errors) pass through.
  if (code && code !== "INTERNAL_SERVER_ERROR") {
    return formattedError;
  }

  const originalError = unwrapResolverError(error);
  const handler = originalError instanceof Error ? errorHandlerMap[originalError.constructor.name] : undefined;
  const handled = handler?.(originalError as Error);

  if (handled) {
    return {
      message: handled.message,
      locations: formattedError.locations,
      path: formattedError.path,
      extensions: { code: handled.code },
    };
  }

  if (env.NODE_ENV === "development") {
    console.error(originalError);
  }

  return {
    message: "Internal server error",
    locations: formattedError.locations,
    path: formattedError.path,
    extensions: { code: "INTERNAL_SERVER_ERROR" },
  };
}
```

- [ ] **Passo 11: Criar os módulos `user` e `auth`**

`src/graphql/modules/user.ts`:

```ts
import { hash } from "bcryptjs";
import { z } from "zod";
import { makeCreateUserUseCase } from "@/use-cases/factory/user/make-create-user-usecase";
import { makeFindUserUseCase } from "@/use-cases/factory/user/make-find-user-usecase";
import { builder } from "../builder";
import { User, UserType } from "../refs";

User.implement({
  fields: (t) => ({
    id: t.exposeInt("id"),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    type: t.field({
      type: UserType,
      resolve: (user) => user.type as "Manager" | "Staff",
    }),
  }),
});

const CreateUserInput = builder
  .inputType("CreateUserInput", {
    fields: (t) => ({
      name: t.string({ required: true }),
      email: t.string({ required: true }),
      password: t.string({ required: true }),
      type: t.field({ type: UserType, required: true }),
    }),
  })
  .validate(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(8, "Password must be at least 8 characters long"),
      type: z.enum(["Manager", "Staff"]),
    }),
  );

builder.mutationField("createUser", (t) =>
  t.field({
    type: User,
    skipTypeScopes: true,
    args: {
      input: t.arg({ type: CreateUserInput, required: true }),
    },
    resolve: async (_root, { input }) => {
      const hashedPassword = await hash(input.password, 10);
      return makeCreateUserUseCase().handle(input.name, input.email, hashedPassword, input.type);
    },
  }),
);

builder.queryField("user", (t) =>
  t.field({
    type: User,
    nullable: true,
    args: {
      email: t.arg.string({ required: true, validate: z.string().email() }),
    },
    resolve: (_root, { email }) => makeFindUserUseCase().handle(email),
  }),
);
```

`src/graphql/modules/auth.ts`:

```ts
import { z } from "zod";
import { signToken } from "@/lib/jwt";
import { makeAuthenticateUseCase } from "@/use-cases/factory/auth/make-authenticate-usecase";
import { makeFindUserByIdUseCase } from "@/use-cases/factory/user/make-find-user-by-id-usecase";
import { builder } from "../builder";
import { AuthPayload, User } from "../refs";

AuthPayload.implement({
  fields: (t) => ({
    token: t.exposeString("token"),
    user: t.field({ type: User, resolve: (payload) => payload.user }),
  }),
});

const LoginInput = builder
  .inputType("LoginInput", {
    fields: (t) => ({
      email: t.string({ required: true }),
      password: t.string({ required: true }),
    }),
  })
  .validate(
    z.object({
      email: z.string().email(),
      password: z.string().min(8, "Password must be at least 8 characters long"),
    }),
  );

builder.mutationField("login", (t) =>
  t.field({
    type: AuthPayload,
    skipTypeScopes: true,
    args: {
      input: t.arg({ type: LoginInput, required: true }),
    },
    resolve: async (_root, { input }) => {
      const user = await makeAuthenticateUseCase().handle(input.email, input.password);
      return { token: signToken({ id: user.id, type: user.type }), user };
    },
  }),
);

builder.queryField("me", (t) =>
  t.field({
    type: User,
    resolve: (_root, _args, context) => makeFindUserByIdUseCase().handle(context.userId),
  }),
);
```

- [ ] **Passo 12: Criar `src/graphql/schema.ts` e `src/graphql/server.ts`**

`src/graphql/schema.ts`:

```ts
import { builder } from "./builder";
import "./modules/auth";
import "./modules/user";

export const schema = builder.toSchema();
```

`src/graphql/server.ts`:

```ts
import { ApolloServer } from "@apollo/server";
import depthLimit from "graphql-depth-limit";
import { env } from "@/env";
import { Context } from "./context";
import { formatError } from "./errors";
import { schema } from "./schema";

export const MAX_QUERY_DEPTH = 7;

export function createApolloServer() {
  return new ApolloServer<Context>({
    schema,
    formatError,
    validationRules: [depthLimit(MAX_QUERY_DEPTH)],
    introspection: env.NODE_ENV !== "production",
    includeStacktraceInErrorResponses: env.NODE_ENV === "development",
  });
}
```

- [ ] **Passo 13: Montar `/graphql` no Express**

Substitua `src/app.ts` inteiro. O REST continua funcionando até a Task 7. O `/graphql` é montado **antes** do `ensureAuth`, porque a autenticação dele é feita pelo scope-auth.

```ts
import express, { NextFunction, Request, Response } from "express";
import { expressMiddleware } from "@as-integrations/express5";
import swaggerUi from "swagger-ui-express";
import { managerRoutes } from "./http/constrollers/manager/routes";
import { userRoutes } from "./http/constrollers/user/routes";
import { staffRoutes } from "./http/constrollers/staff/routes";
import { condominiumRoutes } from "./http/constrollers/condominium/routes";
import { serviceRoutes } from "./http/constrollers/service/routes";
import { authRoutes } from "./http/constrollers/auth/routes";
import { globalErrorHandler } from "./utils/global-error-handler";
import { swaggerSpec } from "./docs/swagger";
import { ensureAuth } from "./http/middlewares/ensure-auth";
import { buildContext } from "./graphql/context";
import { createApolloServer } from "./graphql/server";

export async function createApp() {
  const app = express();

  const apollo = createApolloServer();
  await apollo.start();

  app.use(
    "/graphql",
    express.json(),
    expressMiddleware(apollo, {
      context: async ({ req }) => buildContext(req.headers.authorization),
    }),
  );

  app.use(express.json());
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/docs.json", (_req: Request, res: Response) => {
    return res.status(200).json(swaggerSpec);
  });

  app.use(ensureAuth);

  authRoutes(app);
  managerRoutes(app);
  userRoutes(app);
  staffRoutes(app);
  condominiumRoutes(app);
  serviceRoutes(app);

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    void _next;
    return globalErrorHandler(error, res);
  });

  return app;
}
```

Substitua `src/server.ts` inteiro. O projeto é CommonJS, então não há top-level await.

```ts
import { createApp } from "@/app";
import { env } from "@/env";

createApp().then((app) => {
  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${env.PORT}/graphql`);
  });
});
```

- [ ] **Passo 14: Rodar os testes**

Rode `npm test`. Esperado: todos passam.

Se o teste de `BAD_USER_INPUT` falhar com `INTERNAL_SERVER_ERROR`, o erro do plugin de validação não se chama `InputValidationError` nesta versão. Logue `originalError.constructor.name` dentro de `formatError`, ajuste a chave do `errorHandlerMap` e remova o log.

- [ ] **Passo 15: Smoke test do servidor real**

Rode `npm run dev`. Esperado: `Server is running on http://localhost:3000/graphql`, e abrir `http://localhost:3000/graphql` no navegador mostra o Apollo Sandbox. Encerre com Ctrl+C.

- [ ] **Passo 16: Verificar tipos e lint**

Rode `npx tsc --noEmit && npm run lint`. Esperado: sem erros.

- [ ] **Passo 17: Commit**

```bash
git add package.json package-lock.json src test
git commit -m "Add Apollo GraphQL server with Pothos schema, JWT auth scopes and user/auth modules

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Módulos manager, staff e skill

**Arquivos:**
- Modificar: `src/graphql/refs.ts`, `src/graphql/schema.ts`
- Criar: `src/graphql/modules/manager.ts`, `src/graphql/modules/staff.ts`
- Teste: `test/graphql/people.test.ts`

**Interfaces:**
- Consome: `builder`, `User`, `orderByKeys`, `orderByKeysOrError`, `execute`, `tokenFor`, `seed*`. Dos repositórios: `PrismaUserRepository.findByIds`, `PrismaManagerRepository.findByUserIds`, `PrismaStaffRepository.findByUserIds`, `PrismaStaffSkillRepository.findSkillsByStaffIds`. Das factories: `makeCreateManagerUseCase`, `makeFindManagerUseCase`, `makeCreateStaffUseCase`, `makeFindStaffUseCase`, `makeCreateSkillUseCase`, `makeAddSkillToStaffUseCase`, `makeFindStaffByIdUseCase`.
- Produz:
  - refs `Manager` (`IManager`), `Staff` (`IStaff`), `Skill` (`ISkill`)
  - campos `User.manager`, `User.staff`, `Manager.user`, `Staff.user`, `Staff.skills`
  - `Query.manager(userId)`, `Query.staff(userId)`
  - `Mutation.createManager`, `createStaff`, `createSkill`, `addSkillToStaff`
  - Na Task 6 entram `Manager.condominiums` e `Staff.services`, via `builder.objectField`.

- [ ] **Passo 1: Escrever o teste que falha**

`test/graphql/people.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import * as seed from "../helpers/factories";
import { execute, tokenFor } from "../helpers/graphql";
import { resetDb } from "../helpers/reset-db";

describe("managers, staff and skills", () => {
  let token: string;

  beforeEach(async () => {
    await resetDb();
    token = tokenFor(await seed.seedUser());
  });

  it("createManager and manager(userId) with nested user", async () => {
    const user = await seed.seedUser({ email: "ana@test.com" });

    const created = await execute(
      `mutation ($input: CreateManagerInput!) { createManager(input: $input) { id userId name phone nif } }`,
      { input: { userId: user.id, name: "Ana Manager", phone: "910000000", nif: "123456789" } },
      token,
    );
    expect(created.errors).toBeUndefined();
    expect(created.data?.createManager).toEqual({
      id: expect.any(Number), userId: user.id, name: "Ana Manager", phone: "910000000", nif: "123456789",
    });

    const found = await execute(
      `query ($userId: Int!) { manager(userId: $userId) { name user { email manager { name } staff { id } } } }`,
      { userId: user.id },
      token,
    );
    expect(found.errors).toBeUndefined();
    expect(found.data?.manager).toEqual({
      name: "Ana Manager",
      user: { email: "ana@test.com", manager: { name: "Ana Manager" }, staff: null },
    });
  });

  it("manager(userId) for an unknown user returns NOT_FOUND", async () => {
    const result = await execute(`{ manager(userId: 999) { id } }`, {}, token);
    expect(result.errors?.[0].extensions?.code).toBe("NOT_FOUND");
  });

  it("createManager rejects empty fields with BAD_USER_INPUT", async () => {
    const user = await seed.seedUser();
    const result = await execute(
      `mutation ($input: CreateManagerInput!) { createManager(input: $input) { id } }`,
      { input: { userId: user.id, name: "", phone: "1", nif: "1" } },
      token,
    );
    expect(result.errors?.[0].extensions?.code).toBe("BAD_USER_INPUT");
  });

  it("createStaff, createSkill and addSkillToStaff return the staff with its skills", async () => {
    const user = await seed.seedUser({ type: "Staff" });

    const staff = await execute(
      `mutation ($input: CreateStaffInput!) { createStaff(input: $input) { id name skills { id } } }`,
      { input: { userId: user.id, name: "Bruno", phone: "920000000", nif: "987654321" } },
      token,
    );
    expect(staff.errors).toBeUndefined();
    expect(staff.data?.createStaff.skills).toEqual([]);
    const staffId = staff.data?.createStaff.id;

    const skill = await execute(
      `mutation ($input: CreateSkillInput!) { createSkill(input: $input) { id name } }`,
      { input: { name: "Plumbing" } },
      token,
    );
    expect(skill.data?.createSkill).toEqual({ id: expect.any(Number), name: "Plumbing" });

    const added = await execute(
      `mutation ($input: AddSkillToStaffInput!) { addSkillToStaff(input: $input) { id skills { name } user { id } } }`,
      { input: { staffId, skillId: skill.data?.createSkill.id } },
      token,
    );
    expect(added.errors).toBeUndefined();
    expect(added.data?.addSkillToStaff).toEqual({ id: staffId, skills: [{ name: "Plumbing" }], user: { id: user.id } });
  });

  it("staff(userId) returns [] skills when the staff has none", async () => {
    const staff = await seed.seedStaff();
    const result = await execute(
      `query ($userId: Int!) { staff(userId: $userId) { id skills { id } } }`,
      { userId: staff.user_id },
      token,
    );
    expect(result.errors).toBeUndefined();
    expect(result.data?.staff).toEqual({ id: staff.id, skills: [] });
  });

  it("addSkillToStaff twice returns BAD_USER_INPUT 'Resource already exists'", async () => {
    const staff = await seed.seedStaff();
    const skill = await seed.seedSkill();
    const mutation = `mutation ($input: AddSkillToStaffInput!) { addSkillToStaff(input: $input) { id } }`;
    const input = { staffId: staff.id, skillId: skill.id };

    await execute(mutation, { input }, token);
    const result = await execute(mutation, { input }, token);

    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({ message: "Resource already exists", extensions: expect.objectContaining({ code: "BAD_USER_INPUT" }) }),
    );
  });

  it("addSkillToStaff with an unknown skill returns BAD_USER_INPUT 'Related resource not found'", async () => {
    const staff = await seed.seedStaff();
    const result = await execute(
      `mutation ($input: AddSkillToStaffInput!) { addSkillToStaff(input: $input) { id } }`,
      { input: { staffId: staff.id, skillId: 999 } },
      token,
    );
    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({ message: "Related resource not found", extensions: expect.objectContaining({ code: "BAD_USER_INPUT" }) }),
    );
  });

  it.each([
    [`{ manager(userId: 1) { id } }`],
    [`{ staff(userId: 1) { id } }`],
    [`mutation { createSkill(input: { name: "X" }) { id } }`],
    [`mutation { createManager(input: { userId: 1, name: "a", phone: "b", nif: "c" }) { id } }`],
    [`mutation { createStaff(input: { userId: 1, name: "a", phone: "b", nif: "c" }) { id } }`],
    [`mutation { addSkillToStaff(input: { staffId: 1, skillId: 1 }) { id } }`],
  ])("%s without a token returns UNAUTHENTICATED", async (operation) => {
    const result = await execute(operation);
    expect(result.errors?.[0].extensions?.code).toBe("UNAUTHENTICATED");
  });
});
```

- [ ] **Passo 2: Rodar e confirmar a falha**

Rode `npx vitest run test/graphql/people.test.ts`. Esperado: FAIL, com erros de validação GraphQL do tipo `Unknown type "CreateManagerInput"` / `Cannot query field "manager"`.

- [ ] **Passo 3: Acrescentar refs em `src/graphql/refs.ts`**

Adicione os imports e as refs:

```ts
import { IManager } from "@/entities/models/manager.interface";
import { ISkill } from "@/entities/models/skill.interface";
import { IStaff } from "@/entities/models/staff.interface";
```

```ts
export const Manager = builder.objectRef<IManager>("Manager");

export const Staff = builder.objectRef<IStaff>("Staff");

export const Skill = builder.objectRef<ISkill>("Skill");
```

- [ ] **Passo 4: Criar `src/graphql/modules/manager.ts`**

```ts
import { z } from "zod";
import { PrismaManagerRepository } from "@/repository/prisma/manager.repository";
import { PrismaUserRepository } from "@/repository/prisma/user.repository";
import { makeCreateManagerUseCase } from "@/use-cases/factory/manager/make-create-usecase";
import { makeFindManagerUseCase } from "@/use-cases/factory/manager/make-find-usecase";
import { builder } from "../builder";
import { Manager, User } from "../refs";
import { orderByKeys, orderByKeysOrError } from "../utils/order-by-keys";

const managerRepository = new PrismaManagerRepository();
const userRepository = new PrismaUserRepository();

Manager.implement({
  fields: (t) => ({
    id: t.exposeInt("id"),
    userId: t.exposeInt("user_id"),
    name: t.exposeString("name"),
    phone: t.exposeString("phone"),
    nif: t.exposeString("nif"),
    user: t.loadable({
      type: User,
      load: async (ids: number[]) => orderByKeysOrError(ids, await userRepository.findByIds(ids), (user) => user.id),
      resolve: (manager) => manager.user_id,
    }),
  }),
});

builder.objectField(User, "manager", (t) =>
  t.loadable({
    type: Manager,
    nullable: true,
    load: async (userIds: number[]) =>
      orderByKeys(userIds, await managerRepository.findByUserIds(userIds), (manager) => manager.user_id),
    resolve: (user) => user.id,
  }),
);

const CreateManagerInput = builder
  .inputType("CreateManagerInput", {
    fields: (t) => ({
      userId: t.int({ required: true }),
      name: t.string({ required: true }),
      phone: t.string({ required: true }),
      nif: t.string({ required: true }),
    }),
  })
  .validate(
    z.object({
      userId: z.number().int().positive(),
      name: z.string().min(1),
      phone: z.string().min(1),
      nif: z.string().min(1),
    }),
  );

builder.mutationField("createManager", (t) =>
  t.field({
    type: Manager,
    args: {
      input: t.arg({ type: CreateManagerInput, required: true }),
    },
    resolve: (_root, { input }) =>
      makeCreateManagerUseCase().handle({
        name: input.name,
        phone: input.phone,
        nif: input.nif,
        user_id: input.userId,
      }),
  }),
);

builder.queryField("manager", (t) =>
  t.field({
    type: Manager,
    args: {
      userId: t.arg.int({ required: true }),
    },
    resolve: (_root, { userId }) => makeFindManagerUseCase().handle(userId),
  }),
);
```

- [ ] **Passo 5: Criar `src/graphql/modules/staff.ts`**

```ts
import { z } from "zod";
import { PrismaStaffSkillRepository } from "@/repository/prisma/staff-skill.repository";
import { PrismaStaffRepository } from "@/repository/prisma/staff.repository";
import { PrismaUserRepository } from "@/repository/prisma/user.repository";
import { makeAddSkillToStaffUseCase } from "@/use-cases/factory/staff/make-add-skill-usecase";
import { makeCreateSkillUseCase } from "@/use-cases/factory/staff/make-create-skill-usecase";
import { makeCreateStaffUseCase } from "@/use-cases/factory/staff/make-create-usecase";
import { makeFindStaffByIdUseCase } from "@/use-cases/factory/staff/make-find-staff-by-id-usecase";
import { makeFindStaffUseCase } from "@/use-cases/factory/staff/make-find-usecase";
import { builder } from "../builder";
import { Skill, Staff, User } from "../refs";
import { orderByKeys, orderByKeysOrError } from "../utils/order-by-keys";

const staffRepository = new PrismaStaffRepository();
const staffSkillRepository = new PrismaStaffSkillRepository();
const userRepository = new PrismaUserRepository();

Skill.implement({
  fields: (t) => ({
    id: t.exposeInt("id"),
    name: t.exposeString("name"),
  }),
});

Staff.implement({
  fields: (t) => ({
    id: t.exposeInt("id"),
    userId: t.exposeInt("user_id"),
    name: t.exposeString("name"),
    phone: t.exposeString("phone"),
    nif: t.exposeString("nif"),
    user: t.loadable({
      type: User,
      load: async (ids: number[]) => orderByKeysOrError(ids, await userRepository.findByIds(ids), (user) => user.id),
      resolve: (staff) => staff.user_id,
    }),
    skills: t.loadableGroup({
      type: Skill,
      load: (staffIds: number[]) => staffSkillRepository.findSkillsByStaffIds(staffIds),
      group: (skill) => skill.staff_id,
      resolve: (staff) => staff.id,
    }),
  }),
});

builder.objectField(User, "staff", (t) =>
  t.loadable({
    type: Staff,
    nullable: true,
    load: async (userIds: number[]) =>
      orderByKeys(userIds, await staffRepository.findByUserIds(userIds), (staff) => staff.user_id),
    resolve: (user) => user.id,
  }),
);

const CreateStaffInput = builder
  .inputType("CreateStaffInput", {
    fields: (t) => ({
      userId: t.int({ required: true }),
      name: t.string({ required: true }),
      phone: t.string({ required: true }),
      nif: t.string({ required: true }),
    }),
  })
  .validate(
    z.object({
      userId: z.number().int().positive(),
      name: z.string().min(1),
      phone: z.string().min(1),
      nif: z.string().min(1),
    }),
  );

const CreateSkillInput = builder
  .inputType("CreateSkillInput", {
    fields: (t) => ({
      name: t.string({ required: true }),
    }),
  })
  .validate(z.object({ name: z.string().min(1) }));

const AddSkillToStaffInput = builder
  .inputType("AddSkillToStaffInput", {
    fields: (t) => ({
      staffId: t.int({ required: true }),
      skillId: t.int({ required: true }),
    }),
  })
  .validate(
    z.object({
      staffId: z.number().int().positive(),
      skillId: z.number().int().positive(),
    }),
  );

builder.mutationField("createStaff", (t) =>
  t.field({
    type: Staff,
    args: {
      input: t.arg({ type: CreateStaffInput, required: true }),
    },
    resolve: (_root, { input }) =>
      makeCreateStaffUseCase().handle({
        name: input.name,
        phone: input.phone,
        nif: input.nif,
        user_id: input.userId,
      }),
  }),
);

builder.mutationField("createSkill", (t) =>
  t.field({
    type: Skill,
    args: {
      input: t.arg({ type: CreateSkillInput, required: true }),
    },
    resolve: (_root, { input }) => makeCreateSkillUseCase().handle({ name: input.name }),
  }),
);

builder.mutationField("addSkillToStaff", (t) =>
  t.field({
    type: Staff,
    args: {
      input: t.arg({ type: AddSkillToStaffInput, required: true }),
    },
    resolve: async (_root, { input }) => {
      await makeAddSkillToStaffUseCase().handle({ staff_id: input.staffId, skill_id: input.skillId });
      return makeFindStaffByIdUseCase().handle(input.staffId);
    },
  }),
);

builder.queryField("staff", (t) =>
  t.field({
    type: Staff,
    args: {
      userId: t.arg.int({ required: true }),
    },
    resolve: (_root, { userId }) => makeFindStaffUseCase().handle(userId),
  }),
);
```

- [ ] **Passo 6: Registrar os módulos em `src/graphql/schema.ts`**

```ts
import { builder } from "./builder";
import "./modules/auth";
import "./modules/user";
import "./modules/manager";
import "./modules/staff";

export const schema = builder.toSchema();
```

- [ ] **Passo 7: Rodar testes, tipos e lint**

Rode `npm test && npx tsc --noEmit && npm run lint`. Esperado: tudo verde.

- [ ] **Passo 8: Commit**

```bash
git add src test
git commit -m "Add manager, staff and skill GraphQL modules with batched relations

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Módulos condomínio e serviço (grafo completo, N+1, profundidade)

**Arquivos:**
- Modificar: `src/graphql/refs.ts`, `src/graphql/schema.ts`
- Criar: `src/graphql/modules/condominium.ts`, `src/graphql/modules/service.ts`
- Teste: `test/graphql/services.test.ts`

**Interfaces:**
- Consome: `builder`, `Manager`, `Staff`, `orderByKeysOrError`, `execute`, `tokenFor`, `seed*`, `MAX_QUERY_DEPTH`. Repositórios: `PrismaManagerRepository.findByIds`, `PrismaCondominiumRepository.findByIds`/`findByManagerIds`, `PrismaServiceRepository.findByCondominiumIds`/`findByStaffIds`, `PrismaStaffRepository.findByIds`, `PrismaPhotoServiceRepository.findByServiceIds`, `PrismaCheckListRepository.findByServiceIds`. Factories: `makeCreateCondominiumUseCase`, `makeFindCondominiumsUseCase`, `makeFindCondominiumByIdUseCase`, `makeCreateServiceUseCase`, `makeFindServiceByIdUseCase`, `makeCreatePhotoServiceUseCase`, `makeCreateCheckListUseCase`, `makeCreateCheckListItemUseCase`.
- Produz:
  - refs `Condominium`, `Service`, `PhotoService`, `CheckList`, `CheckListItem`
  - campos `Condominium.managers`, `Condominium.services`, `Manager.condominiums`, `Service.condominium`, `Service.staff`, `Service.photos`, `Service.checkLists`, `Staff.services`, `CheckList.items`
  - `Query.condominiums`, `Query.condominium(id)`, `Query.service(id)`
  - `Mutation.createCondominium`, `createService`, `createPhotoService`, `createCheckList`, `createCheckListItem`

- [ ] **Passo 1: Escrever o teste que falha**

`test/graphql/services.test.ts`:

```ts
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaCheckListRepository } from "@/repository/prisma/check-list.repository";
import { PrismaManagerRepository } from "@/repository/prisma/manager.repository";
import { PrismaPhotoServiceRepository } from "@/repository/prisma/photo-service.repository";
import { PrismaServiceRepository } from "@/repository/prisma/service.repository";
import { PrismaStaffRepository } from "@/repository/prisma/staff.repository";
import * as seed from "../helpers/factories";
import { execute, tokenFor } from "../helpers/graphql";
import { resetDb } from "../helpers/reset-db";

const TREE = /* GraphQL */ `
  {
    condominiums {
      id
      name
      managers { name }
      services {
        description
        startDate
        price
        staff { name }
        photos { photoUrl createdAt }
        checkLists { description createdAt items { description completed } }
      }
    }
  }
`;

async function seedTree() {
  const manager = await seed.seedManager(undefined, { name: "Ana" });
  const [s1, s2] = [await seed.seedStaff(undefined, { name: "Bruno" }), await seed.seedStaff(undefined, { name: "Carla" })];

  for (const name of ["Alpha", "Beta"]) {
    const condo = await seed.seedCondominium([manager.id], { name });
    for (const staff of [s1, s2]) {
      const service = await seed.seedService(condo.id, staff.id);
      await seed.seedPhoto(service.id);
      const list = await seed.seedCheckList(service.id);
      await seed.seedCheckListItem(list.id, { completed: true });
      await seed.seedCheckListItem(list.id);
    }
  }

  return { manager, staff: [s1, s2] };
}

describe("condominiums and services", () => {
  let token: string;

  beforeEach(async () => {
    await resetDb();
    token = tokenFor(await seed.seedUser());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves the full condominium → service → photos/checkLists tree", async () => {
    await seedTree();

    const result = await execute(TREE, {}, token);

    expect(result.errors).toBeUndefined();
    const condominiums = result.data?.condominiums;
    expect(condominiums.map((c: { name: string }) => c.name).sort()).toEqual(["Alpha", "Beta"]);

    for (const condo of condominiums) {
      expect(condo.managers).toEqual([{ name: "Ana" }]);
      expect(condo.services).toHaveLength(2);
      expect(condo.services.map((s: { staff: { name: string } }) => s.staff.name).sort()).toEqual(["Bruno", "Carla"]);

      for (const service of condo.services) {
        expect(service.startDate).toBe("2026-01-10");
        expect(service.price).toBe(100);
        expect(service.photos).toHaveLength(1);
        expect(new Date(service.photos[0].createdAt).toString()).not.toBe("Invalid Date");
        expect(service.checkLists).toHaveLength(1);
        expect(service.checkLists[0].items.map((i: { completed: boolean }) => i.completed).sort()).toEqual([false, true]);
      }
    }
  });

  it("batches every relation level into a single repository call (no N+1)", async () => {
    await seedTree();
    const spies = [
      vi.spyOn(PrismaManagerRepository.prototype, "findByIds"),
      vi.spyOn(PrismaServiceRepository.prototype, "findByCondominiumIds"),
      vi.spyOn(PrismaStaffRepository.prototype, "findByIds"),
      vi.spyOn(PrismaPhotoServiceRepository.prototype, "findByServiceIds"),
      vi.spyOn(PrismaCheckListRepository.prototype, "findByServiceIds"),
    ];

    const result = await execute(TREE, {}, token);

    expect(result.errors).toBeUndefined();
    for (const spy of spies) {
      expect(spy).toHaveBeenCalledTimes(1);
    }
  });

  it("returns [] for a condominium without services", async () => {
    const manager = await seed.seedManager();
    const condo = await seed.seedCondominium([manager.id]);

    const result = await execute(`query ($id: Int!) { condominium(id: $id) { services { id } } }`, { id: condo.id }, token);

    expect(result.errors).toBeUndefined();
    expect(result.data?.condominium.services).toEqual([]);
  });

  it("condominium and service lookups return NOT_FOUND / BAD_USER_INPUT", async () => {
    const missingCondo = await execute(`{ condominium(id: 999) { id } }`, {}, token);
    expect(missingCondo.errors?.[0].extensions?.code).toBe("NOT_FOUND");

    const missingService = await execute(`query ($id: ID!) { service(id: $id) { id } }`, { id: randomUUID() }, token);
    expect(missingService.errors?.[0].extensions?.code).toBe("NOT_FOUND");

    const badId = await execute(`{ service(id: "not-a-uuid") { id } }`, {}, token);
    expect(badId.errors?.[0].extensions?.code).toBe("BAD_USER_INPUT");
  });

  it("createCondominium deduplicates managerIds and exposes Manager.condominiums", async () => {
    const manager = await seed.seedManager();
    const input = {
      name: "Gamma", address: "Rua B, 2", city: "Porto", state: "Porto", zip: "4000-001", country: "PT",
      managerIds: [manager.id, manager.id],
    };

    const created = await execute(
      `mutation ($input: CreateCondominiumInput!) { createCondominium(input: $input) { id name managers { id } } }`,
      { input },
      token,
    );
    expect(created.errors).toBeUndefined();
    expect(created.data?.createCondominium).toEqual({ id: expect.any(Number), name: "Gamma", managers: [{ id: manager.id }] });

    const viaManager = await execute(
      `query ($userId: Int!) { manager(userId: $userId) { condominiums { name } } }`,
      { userId: manager.user_id },
      token,
    );
    expect(viaManager.data?.manager.condominiums).toEqual([{ name: "Gamma" }]);
  });

  it("createCondominium with an unknown manager returns BAD_USER_INPUT 'Related resource not found'", async () => {
    const result = await execute(
      `mutation ($input: CreateCondominiumInput!) { createCondominium(input: $input) { id } }`,
      { input: { name: "X", address: "a", city: "b", state: "c", zip: "d", country: "e", managerIds: [999] } },
      token,
    );
    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({ message: "Related resource not found", extensions: expect.objectContaining({ code: "BAD_USER_INPUT" }) }),
    );
  });

  it("createCondominium without managers returns BAD_USER_INPUT", async () => {
    const result = await execute(
      `mutation ($input: CreateCondominiumInput!) { createCondominium(input: $input) { id } }`,
      { input: { name: "X", address: "a", city: "b", state: "c", zip: "d", country: "e", managerIds: [] } },
      token,
    );
    expect(result.errors?.[0].extensions?.code).toBe("BAD_USER_INPUT");
  });

  it("service mutations round-trip dates, price, photos and check list items", async () => {
    const manager = await seed.seedManager();
    const condo = await seed.seedCondominium([manager.id]);
    const staff = await seed.seedStaff();

    const service = await execute(
      `mutation ($input: CreateServiceInput!) {
        createService(input: $input) { id startDate endDate price status condominium { id } staff { id } }
      }`,
      {
        input: {
          condominiumId: condo.id, staffId: staff.id, description: "Fix roof",
          startDate: "2026-01-31", endDate: "2026-02-01", status: "pending", price: 10.5,
        },
      },
      token,
    );
    expect(service.errors).toBeUndefined();
    expect(service.data?.createService).toEqual({
      id: expect.any(String), startDate: "2026-01-31", endDate: "2026-02-01", price: 10.5, status: "pending",
      condominium: { id: condo.id }, staff: { id: staff.id },
    });
    const serviceId = service.data?.createService.id;

    const photo = await execute(
      `mutation ($input: CreatePhotoServiceInput!) { createPhotoService(input: $input) { id photoUrl } }`,
      { input: { serviceId, photoUrl: "https://img.test/roof.jpg" } },
      token,
    );
    expect(photo.errors).toBeUndefined();

    const list = await execute(
      `mutation ($input: CreateCheckListInput!) { createCheckList(input: $input) { id description items { id } } }`,
      { input: { serviceId, description: "Roof" } },
      token,
    );
    expect(list.errors).toBeUndefined();
    expect(list.data?.createCheckList.items).toEqual([]);

    const item = await execute(
      `mutation ($input: CreateCheckListItemInput!) { createCheckListItem(input: $input) { description completed } }`,
      { input: { checkListId: list.data?.createCheckList.id, description: "Replace tiles" } },
      token,
    );
    expect(item.data?.createCheckListItem).toEqual({ description: "Replace tiles", completed: false });

    const fetched = await execute(
      `query ($id: ID!) { service(id: $id) { photos { photoUrl } checkLists { items { description } } } }`,
      { id: serviceId },
      token,
    );
    expect(fetched.data?.service).toEqual({
      photos: [{ photoUrl: "https://img.test/roof.jpg" }],
      checkLists: [{ items: [{ description: "Replace tiles" }] }],
    });

    const viaStaff = await execute(
      `query ($userId: Int!) { staff(userId: $userId) { services { id } } }`,
      { userId: staff.user_id },
      token,
    );
    expect(viaStaff.data?.staff.services).toEqual([{ id: serviceId }]);
  });

  it("createService rejects invalid dates and negative prices", async () => {
    const mutation = `mutation ($input: CreateServiceInput!) { createService(input: $input) { id } }`;
    const base = { condominiumId: 1, staffId: 1, description: "x", startDate: "2026-01-31", endDate: "2026-02-01", status: "pending", price: 1 };

    for (const input of [{ ...base, startDate: "31/01/2026" }, { ...base, price: -1 }]) {
      const result = await execute(mutation, { input }, token);
      expect(result.errors?.[0].extensions?.code).toBe("BAD_USER_INPUT");
    }
  });

  it("rejects queries deeper than the maximum depth", async () => {
    const deep = `{ condominiums { services { staff { services { staff { services { staff { services { staff { id } } } } } } } } } }`;

    const result = await execute(deep, {}, token);

    expect(result.errors?.[0].message).toMatch(/exceeds maximum operation depth/);
  });
});
```

- [ ] **Passo 2: Rodar e confirmar a falha**

Rode `npx vitest run test/graphql/services.test.ts`. Esperado: FAIL com `Cannot query field "condominiums"`.

- [ ] **Passo 3: Acrescentar refs em `src/graphql/refs.ts`**

Adicione os imports:

```ts
import { ICheckListItem } from "@/entities/models/check-list-item.interface";
import { ICheckList } from "@/entities/models/check-list.interface";
import { ICondominium } from "@/entities/models/condominium.interface";
import { IPhotoService } from "@/entities/models/photo-service.interface";
import { IService } from "@/entities/models/service.interface";
```

E as refs:

```ts
export const Condominium = builder.objectRef<ICondominium>("Condominium");

export const Service = builder.objectRef<IService>("Service");

export const PhotoService = builder.objectRef<IPhotoService>("PhotoService");

// `items` is present when loaded via findByServiceIds and absent right after createCheckList.
export const CheckList = builder.objectRef<ICheckList & { items?: ICheckListItem[] }>("CheckList");

export const CheckListItem = builder.objectRef<ICheckListItem>("CheckListItem");
```

- [ ] **Passo 4: Criar `src/graphql/modules/condominium.ts`**

```ts
import { z } from "zod";
import { PrismaCondominiumRepository } from "@/repository/prisma/condominium.repository";
import { PrismaManagerRepository } from "@/repository/prisma/manager.repository";
import { PrismaServiceRepository } from "@/repository/prisma/service.repository";
import { makeCreateCondominiumUseCase } from "@/use-cases/factory/condominium/make-create-usecase";
import { makeFindCondominiumByIdUseCase } from "@/use-cases/factory/condominium/make-find-by-id-usecase";
import { makeFindCondominiumsUseCase } from "@/use-cases/factory/condominium/make-find-usecase";
import { builder } from "../builder";
import { Condominium, Manager, Service } from "../refs";
import { orderByKeysOrError } from "../utils/order-by-keys";

const condominiumRepository = new PrismaCondominiumRepository();
const managerRepository = new PrismaManagerRepository();
const serviceRepository = new PrismaServiceRepository();

Condominium.implement({
  fields: (t) => ({
    id: t.exposeInt("id"),
    name: t.exposeString("name"),
    address: t.exposeString("address"),
    city: t.exposeString("city"),
    state: t.exposeString("state"),
    zip: t.exposeString("zip"),
    country: t.exposeString("country"),
    managers: t.loadable({
      type: [Manager],
      load: async (ids: number[]) =>
        orderByKeysOrError(ids, await managerRepository.findByIds(ids), (manager) => manager.id),
      resolve: (condominium) => condominium.manager_ids,
    }),
    services: t.loadableGroup({
      type: Service,
      load: (condominiumIds: number[]) => serviceRepository.findByCondominiumIds(condominiumIds),
      group: (service) => service.condominium_id,
      resolve: (condominium) => condominium.id,
    }),
  }),
});

builder.objectField(Manager, "condominiums", (t) =>
  t.loadableGroup({
    type: Condominium,
    load: (managerIds: number[]) => condominiumRepository.findByManagerIds(managerIds),
    group: (condominium) => condominium.manager_id,
    resolve: (manager) => manager.id,
  }),
);

const CreateCondominiumInput = builder
  .inputType("CreateCondominiumInput", {
    fields: (t) => ({
      name: t.string({ required: true }),
      address: t.string({ required: true }),
      city: t.string({ required: true }),
      state: t.string({ required: true }),
      zip: t.string({ required: true }),
      country: t.string({ required: true }),
      managerIds: t.intList({ required: true }),
    }),
  })
  .validate(
    z.object({
      name: z.string().min(1),
      address: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      zip: z.string().min(1),
      country: z.string().min(1),
      managerIds: z
        .array(z.number().int().positive())
        .min(1)
        .transform((managerIds) => [...new Set(managerIds)]),
    }),
  );

builder.mutationField("createCondominium", (t) =>
  t.field({
    type: Condominium,
    args: {
      input: t.arg({ type: CreateCondominiumInput, required: true }),
    },
    resolve: (_root, { input }) =>
      makeCreateCondominiumUseCase().handle({
        name: input.name,
        address: input.address,
        city: input.city,
        state: input.state,
        zip: input.zip,
        country: input.country,
        manager_ids: input.managerIds,
      }),
  }),
);

builder.queryField("condominiums", (t) =>
  t.field({
    type: [Condominium],
    resolve: () => makeFindCondominiumsUseCase().handle(),
  }),
);

builder.queryField("condominium", (t) =>
  t.field({
    type: Condominium,
    args: {
      id: t.arg.int({ required: true }),
    },
    resolve: (_root, { id }) => makeFindCondominiumByIdUseCase().handle(id),
  }),
);
```

- [ ] **Passo 5: Criar `src/graphql/modules/service.ts`**

```ts
import { z } from "zod";
import { PrismaCheckListRepository } from "@/repository/prisma/check-list.repository";
import { PrismaCondominiumRepository } from "@/repository/prisma/condominium.repository";
import { PrismaPhotoServiceRepository } from "@/repository/prisma/photo-service.repository";
import { PrismaServiceRepository } from "@/repository/prisma/service.repository";
import { PrismaStaffRepository } from "@/repository/prisma/staff.repository";
import { makeCreateCheckListItemUseCase } from "@/use-cases/factory/service/make-create-check-list-item-usecase";
import { makeCreateCheckListUseCase } from "@/use-cases/factory/service/make-create-check-list-usecase";
import { makeCreatePhotoServiceUseCase } from "@/use-cases/factory/service/make-create-photo-service-usecase";
import { makeCreateServiceUseCase } from "@/use-cases/factory/service/make-create-usecase";
import { makeFindServiceByIdUseCase } from "@/use-cases/factory/service/make-find-by-id-usecase";
import { builder } from "../builder";
import { CheckList, CheckListItem, Condominium, PhotoService, Service, Staff } from "../refs";
import { orderByKeysOrError } from "../utils/order-by-keys";

const checkListRepository = new PrismaCheckListRepository();
const condominiumRepository = new PrismaCondominiumRepository();
const photoServiceRepository = new PrismaPhotoServiceRepository();
const serviceRepository = new PrismaServiceRepository();
const staffRepository = new PrismaStaffRepository();

Service.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    description: t.exposeString("description"),
    startDate: t.exposeString("start_date"),
    endDate: t.exposeString("end_date"),
    status: t.exposeString("status"),
    price: t.exposeFloat("price"),
    condominium: t.loadable({
      type: Condominium,
      load: async (ids: number[]) =>
        orderByKeysOrError(ids, await condominiumRepository.findByIds(ids), (condominium) => condominium.id),
      resolve: (service) => service.condominium_id,
    }),
    staff: t.loadable({
      type: Staff,
      load: async (ids: number[]) => orderByKeysOrError(ids, await staffRepository.findByIds(ids), (staff) => staff.id),
      resolve: (service) => service.staff_id,
    }),
    photos: t.loadableGroup({
      type: PhotoService,
      load: (serviceIds: string[]) => photoServiceRepository.findByServiceIds(serviceIds),
      group: (photo) => photo.service_id,
      resolve: (service) => service.id,
    }),
    checkLists: t.loadableGroup({
      type: CheckList,
      load: (serviceIds: string[]) => checkListRepository.findByServiceIds(serviceIds),
      group: (checkList) => checkList.service_id,
      resolve: (service) => service.id,
    }),
  }),
});

builder.objectField(Staff, "services", (t) =>
  t.loadableGroup({
    type: Service,
    load: (staffIds: number[]) => serviceRepository.findByStaffIds(staffIds),
    group: (service) => service.staff_id,
    resolve: (staff) => staff.id,
  }),
);

PhotoService.implement({
  fields: (t) => ({
    id: t.exposeInt("id"),
    photoUrl: t.exposeString("photo_url"),
    createdAt: t.string({ resolve: (photo) => photo.created_at.toISOString() }),
  }),
});

CheckList.implement({
  fields: (t) => ({
    id: t.exposeInt("id"),
    description: t.exposeString("description"),
    createdAt: t.string({ resolve: (checkList) => checkList.created_at.toISOString() }),
    items: t.field({
      type: [CheckListItem],
      resolve: (checkList) => checkList.items ?? [],
    }),
  }),
});

CheckListItem.implement({
  fields: (t) => ({
    id: t.exposeInt("id"),
    description: t.exposeString("description"),
    completed: t.exposeBoolean("completed"),
  }),
});

const CreateServiceInput = builder
  .inputType("CreateServiceInput", {
    fields: (t) => ({
      condominiumId: t.int({ required: true }),
      staffId: t.int({ required: true }),
      description: t.string({ required: true }),
      startDate: t.string({ required: true }),
      endDate: t.string({ required: true }),
      status: t.string({ required: true }),
      price: t.float({ required: true }),
    }),
  })
  .validate(
    z.object({
      condominiumId: z.number().int().positive(),
      staffId: z.number().int().positive(),
      description: z.string().min(1),
      startDate: z.string().date(),
      endDate: z.string().date(),
      status: z.string().min(1),
      price: z.number().nonnegative(),
    }),
  );

const CreatePhotoServiceInput = builder
  .inputType("CreatePhotoServiceInput", {
    fields: (t) => ({
      serviceId: t.id({ required: true }),
      photoUrl: t.string({ required: true }),
    }),
  })
  .validate(
    z.object({
      serviceId: z.string().uuid(),
      photoUrl: z.string().min(1),
    }),
  );

const CreateCheckListInput = builder
  .inputType("CreateCheckListInput", {
    fields: (t) => ({
      serviceId: t.id({ required: true }),
      description: t.string({ required: true }),
    }),
  })
  .validate(
    z.object({
      serviceId: z.string().uuid(),
      description: z.string().min(1),
    }),
  );

const CreateCheckListItemInput = builder
  .inputType("CreateCheckListItemInput", {
    fields: (t) => ({
      checkListId: t.int({ required: true }),
      description: t.string({ required: true }),
      completed: t.boolean(),
    }),
  })
  .validate(
    z.object({
      checkListId: z.number().int().positive(),
      description: z.string().min(1),
      completed: z
        .boolean()
        .nullish()
        .transform((completed) => completed ?? false),
    }),
  );

builder.mutationField("createService", (t) =>
  t.field({
    type: Service,
    args: {
      input: t.arg({ type: CreateServiceInput, required: true }),
    },
    resolve: (_root, { input }) =>
      makeCreateServiceUseCase().handle({
        condominium_id: input.condominiumId,
        staff_id: input.staffId,
        description: input.description,
        start_date: input.startDate,
        end_date: input.endDate,
        status: input.status,
        price: input.price,
      }),
  }),
);

builder.mutationField("createPhotoService", (t) =>
  t.field({
    type: PhotoService,
    args: {
      input: t.arg({ type: CreatePhotoServiceInput, required: true }),
    },
    resolve: (_root, { input }) =>
      makeCreatePhotoServiceUseCase().handle({ service_id: input.serviceId, photo_url: input.photoUrl }),
  }),
);

builder.mutationField("createCheckList", (t) =>
  t.field({
    type: CheckList,
    args: {
      input: t.arg({ type: CreateCheckListInput, required: true }),
    },
    resolve: (_root, { input }) =>
      makeCreateCheckListUseCase().handle({ service_id: input.serviceId, description: input.description }),
  }),
);

builder.mutationField("createCheckListItem", (t) =>
  t.field({
    type: CheckListItem,
    args: {
      input: t.arg({ type: CreateCheckListItemInput, required: true }),
    },
    resolve: (_root, { input }) =>
      makeCreateCheckListItemUseCase().handle({
        check_list_id: input.checkListId,
        description: input.description,
        completed: input.completed,
      }),
  }),
);

builder.queryField("service", (t) =>
  t.field({
    type: Service,
    args: {
      id: t.arg.id({ required: true, validate: z.string().uuid() }),
    },
    resolve: (_root, { id }) => makeFindServiceByIdUseCase().handle(String(id)),
  }),
);
```

- [ ] **Passo 6: Registrar os módulos em `src/graphql/schema.ts`**

```ts
import { builder } from "./builder";
import "./modules/auth";
import "./modules/user";
import "./modules/manager";
import "./modules/staff";
import "./modules/condominium";
import "./modules/service";

export const schema = builder.toSchema();
```

- [ ] **Passo 7: Rodar testes, tipos e lint**

Rode `npm test && npx tsc --noEmit && npm run lint`. Esperado: tudo verde.

Dois ajustes possíveis:
- Se o teste de N+1 acusar `findByIds` do manager chamado 0 vezes, confirme que `Condominium.managers` usa `t.loadable` com `type: [Manager]`.
- Se `t.exposeString("start_date")` reclamar de tipo, confira que `IService.start_date` é `string`.

- [ ] **Passo 8: Commit**

```bash
git add src test
git commit -m "Add condominium and service GraphQL modules with batched nested relations

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Remover o REST, limpar código morto e documentar a API

**Arquivos:**
- Remover: `src/http/`, `src/docs/`, `src/utils/global-error-handler.ts`, `docs/api-miro.md`
- Remover: `src/use-cases/find-staff-skills.ts`, `src/use-cases/find-services-by-condominium.ts`, `src/use-cases/find-photos-by-service.ts`, `src/use-cases/find-check-lists-by-service.ts`
- Remover: `src/use-cases/factory/staff/make-find-skills-usecase.ts`, `src/use-cases/factory/condominium/make-find-services-usecase.ts`, `src/use-cases/factory/service/make-find-photos-usecase.ts`, `src/use-cases/factory/service/make-find-check-lists-usecase.ts`
- Modificar: `src/app.ts`, `package.json`, as interfaces e implementações dos repositórios de user, staff-skill, service, photo-service e check-list
- Modificar: `docs/superpowers/specs/2026-09-23-graphql-migration-design.md`, para registrar os desvios
- Criar: `docs/api-graphql.md`
- Teste: `test/graphql/http.test.ts` (acrescentar caso)

**Interfaces:**
- Consome: tudo das tasks 4 a 6.
- Produz: `createApp()` servindo só `/graphql`.

- [ ] **Passo 1: Escrever o teste que falha**

Acrescente em `test/graphql/http.test.ts`, dentro do `describe`:

```ts
  it("no longer serves the REST API or Swagger", async () => {
    for (const path of ["/condominiums", "/docs", "/docs.json", "/auth/me"]) {
      const response = await fetch(`${url}${path}`);
      expect(response.status, path).toBe(404);
    }
  });
```

- [ ] **Passo 2: Rodar e confirmar a falha**

Rode `npx vitest run test/graphql/http.test.ts`. Esperado: FAIL. `/condominiums` responde 401 (via `ensureAuth`) e `/docs` responde 200/301.

- [ ] **Passo 3: Substituir `src/app.ts`**

```ts
import express from "express";
import { expressMiddleware } from "@as-integrations/express5";
import { buildContext } from "./graphql/context";
import { createApolloServer } from "./graphql/server";

export async function createApp() {
  const app = express();

  const apollo = createApolloServer();
  await apollo.start();

  app.use(
    "/graphql",
    express.json(),
    expressMiddleware(apollo, {
      context: async ({ req }) => buildContext(req.headers.authorization),
    }),
  );

  return app;
}
```

- [ ] **Passo 4: Remover o REST e o código morto**

```bash
git rm -r src/http src/docs src/utils/global-error-handler.ts docs/api-miro.md
git rm src/use-cases/find-staff-skills.ts src/use-cases/find-services-by-condominium.ts src/use-cases/find-photos-by-service.ts src/use-cases/find-check-lists-by-service.ts
git rm src/use-cases/factory/staff/make-find-skills-usecase.ts src/use-cases/factory/condominium/make-find-services-usecase.ts src/use-cases/factory/service/make-find-photos-usecase.ts src/use-cases/factory/service/make-find-check-lists-usecase.ts
npm uninstall swagger-jsdoc swagger-ui-express @types/swagger-jsdoc @types/swagger-ui-express
```

- [ ] **Passo 5: Remover os métodos de repositório sem uso**

Remova da interface **e** da implementação Prisma de cada repositório:
- `IUserRepository.findByUserId`: remova também o import de `IManager` em `user.repository.interface.ts` e `user.repository.ts`.
- `IStaffSkillRepository.findSkillsByStaffId`: remova também o import de `ISkill`, se ficar sem uso na interface.
- `IServiceRepository.findByCondominiumId`
- `IPhotoServiceRepository.findByServiceId`
- `ICheckListRepository.findByServiceId`

Depois confirme que não sobrou referência:

```bash
grep -rnE "findByUserId\b|findSkillsByStaffId\b|findByCondominiumId\b|findByServiceId\b|swagger|http/constrollers|global-error-handler" src test
```

Esperado: nenhuma saída.

- [ ] **Passo 6: Criar `docs/api-graphql.md`**

````markdown
# Documentação da API (GraphQL)

- Endpoint: `POST http://localhost:3000/graphql`
- `Content-Type: application/json`
- Autenticação: header `Authorization: Bearer <token>`, exigido em todas as operações exceto `login` e `createUser`.
- Em desenvolvimento, abra `http://localhost:3000/graphql` no navegador para usar o Apollo Sandbox (explorer e autocomplete do schema).

## Erros

As respostas usam HTTP 200, e os erros vêm em `errors[].extensions.code`:

| Código | Quando |
|---|---|
| `UNAUTHENTICATED` | Sem token, token inválido ou expirado (`"Not authenticated"`), ou credenciais erradas no login (`"Invalid credentials"`) |
| `BAD_USER_INPUT` | Validação do input, registro duplicado (`"Resource already exists"`) ou id relacionado inexistente (`"Related resource not found"`) |
| `NOT_FOUND` | Recurso buscado por id não existe |
| `INTERNAL_SERVER_ERROR` | Erro inesperado |
| `GRAPHQL_VALIDATION_FAILED` | Query inválida ou com profundidade acima de 7 |

## Autenticação

```graphql
mutation {
  createUser(input: { name: "Rapha", email: "rapha@email.com", password: "12345678", type: Manager }) {
    id
    email
  }
}

mutation {
  login(input: { email: "rapha@email.com", password: "12345678" }) {
    token
    user { id name type }
  }
}

query {
  me { id name email type manager { id } staff { id } }
}
```

## Managers e staff

```graphql
mutation {
  createManager(input: { userId: 1, name: "Rapha", phone: "910000000", nif: "123456789" }) { id }
}

mutation {
  createStaff(input: { userId: 2, name: "Bruno", phone: "920000000", nif: "987654321" }) { id }
}

mutation { createSkill(input: { name: "Canalização" }) { id } }

mutation {
  addSkillToStaff(input: { staffId: 1, skillId: 1 }) { id skills { name } }
}

query {
  manager(userId: 1) { name condominiums { name } }
  staff(userId: 2) { name skills { name } services { description status } }
}
```

## Condomínios e serviços

```graphql
mutation {
  createCondominium(input: {
    name: "Edifício Sol", address: "Rua A, 1", city: "Lisboa", state: "Lisboa",
    zip: "1000-001", country: "PT", managerIds: [1]
  }) { id }
}

mutation {
  createService(input: {
    condominiumId: 1, staffId: 1, description: "Reparar telhado",
    startDate: "2026-01-31", endDate: "2026-02-01", status: "pending", price: 150.5
  }) { id }
}

mutation { createPhotoService(input: { serviceId: "<uuid>", photoUrl: "https://..." }) { id } }
mutation { createCheckList(input: { serviceId: "<uuid>", description: "Telhado" }) { id } }
mutation { createCheckListItem(input: { checkListId: 1, description: "Trocar telhas" }) { id completed } }
```

Consulta aninhada, que substitui as antigas rotas `/condominiums/:id/services`, `/services/:id/photos` e `/services/:id/check-lists`:

```graphql
query {
  condominiums {
    name
    managers { name }
    services {
      description
      startDate
      price
      staff { name }
      photos { photoUrl }
      checkLists { description items { description completed } }
    }
  }
  condominium(id: 1) { name }
  service(id: "<uuid>") { status }
}
```

## Mapa REST → GraphQL

| REST (removido) | GraphQL |
|---|---|
| `POST /auth/login` | `mutation login` |
| `GET /auth/me` | `query me` |
| `POST /users` / `GET /users/:email` | `mutation createUser` / `query user(email)` |
| `POST /managers` / `GET /managers/:user_id` | `mutation createManager` / `query manager(userId)` |
| `POST /staff` / `GET /staff/:user_id` | `mutation createStaff` / `query staff(userId)` |
| `POST /skills` | `mutation createSkill` |
| `POST /staff/:id/skills` / `GET /staff/:id/skills` | `mutation addSkillToStaff` / campo `Staff.skills` |
| `POST /condominiums` / `GET /condominiums` | `mutation createCondominium` / `query condominiums` |
| `GET /condominiums/:id/services` | `query condominium(id) { services }` |
| `POST /services` | `mutation createService` |
| `POST /services/:id/photos` / `GET` | `mutation createPhotoService` / `Service.photos` |
| `POST /services/:id/check-lists` / `GET` | `mutation createCheckList` / `Service.checkLists` |
| `POST /check-lists/:id/items` | `mutation createCheckListItem` |
````

- [ ] **Passo 7: Registrar os desvios na spec**

Em `docs/superpowers/specs/2026-09-23-graphql-migration-design.md`, aplique:

1. Na árvore de **Estrutura**:
   - remova a linha `loaders.ts`;
   - troque o comentário de `context.ts` por `# lê Authorization → { userId: number | null }`;
   - acrescente `refs.ts  # objectRefs compartilhados (evita import circular)` e `utils/order-by-keys.ts`.
2. Na seção **DataLoaders**, troque o primeiro parágrafo por:

   > O `@pothos/plugin-dataloader` cria os loaders por request automaticamente (a partir do objeto de context). Cada campo relacional usa `t.loadable` / `t.loadableGroup`, que chamam os repositórios diretamente.

   Remova a linha `managersByCondominiumId` da tabela e acrescente abaixo dela:

   > `Condominium.managers` usa `manager_ids`, que o repositório já retorna, com `IManagerRepository.findByIds`.
3. Em **Removido**, acrescente:

   > `find-services-by-condominium`, `find-photos-by-service`, `find-check-lists-by-service` e suas factories, além dos métodos de repositório que só eles usavam (`findByCondominiumId`, `findByServiceId`, `findSkillsByStaffId`, `findByUserId`). Tudo isso foi substituído pelos campos aninhados.
4. Em **Mantido**, acrescente:

   > Novos: `AuthenticateUseCase`, `FindStaffByIdUseCase` e `src/lib/jwt.ts`.

- [ ] **Passo 8: Rodar a verificação completa**

```bash
npm test
npx tsc --noEmit
npm run lint
```

Esperado: tudo verde.

- [ ] **Passo 9: Smoke manual com Docker**

```bash
npm run docker:up
```

No Apollo Sandbox (`http://localhost:3000/graphql`), rode esta sequência: `createUser` → `login` → cole o token no header `Authorization` → `createManager` → `createStaff` → `createCondominium` → `createService` → `createCheckList` → `createCheckListItem` → `createPhotoService` → a query aninhada de `docs/api-graphql.md`. Esperado: todas respondem sem `errors`. Depois rode `npm run docker:down`.

- [ ] **Passo 10: Commit**

```bash
git add -A
git commit -m "Remove REST controllers, Swagger and dead use cases; document the GraphQL API

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```
