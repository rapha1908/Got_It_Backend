# Got It — Backend

GraphQL API for managing maintenance services in residential condominiums. Managers run condominiums, staff members are registered with their skills, and every service performed at a condominium keeps photos and checklists to track the work.

## Stack

- **Node.js 22** + **TypeScript**
- **Apollo Server 5** on **Express 5**
- **Pothos** (code-first schema) with scope-auth, validation (Zod) and dataloader plugins
- **Prisma 6** + **PostgreSQL 16**
- **JWT** (1-day expiry) and **bcrypt** for passwords
- **Vitest** for integration tests against a real Postgres
- **Docker Compose** for the database and the API

## Domain

- **User**: login account, of type `Manager` or `Staff`
- **Manager**: many-to-many with condominiums (`CondominiumManager`)
- **Staff**: technician; many-to-many with skills (`StaffSkill` → `Skill`)
- **Condominium**: address and the services performed there
- **Service**: work done by a staff member at a condominium, with dates, status and price
  - **PhotoService**: photos of the service
  - **CheckList** → **CheckListItem**: service tasks and whether they are done

## Running

### Option 1: everything in Docker

```bash
npm run docker:up
```

Starts Postgres and the API at `http://localhost:3000/graphql`, applying migrations automatically. It uses [.env.docker](.env.docker), which runs in `production` mode (introspection and Apollo Sandbox disabled). To stop and remove the database volume:

```bash
npm run docker:down
```

### Option 2: local development (hot reload + Apollo Sandbox)

1. Start only the database:

   ```bash
   docker compose up -d postgres
   ```

2. Create a `.env` file in the project root:

   ```env
   PORT=3000
   NODE_ENV=development

   POSTGRES_USER=user
   POSTGRES_PASSWORD=password
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=gotit

   JWT_SECRET=change-me
   DATABASE_URL=postgresql://user:password@localhost:5432/gotit
   ```

3. Install dependencies, generate the Prisma Client and apply migrations:

   ```bash
   npm install
   npx prisma generate
   npm run db:migrate:deploy
   ```

4. Start the server:

   ```bash
   npm run dev
   ```

Open `http://localhost:3000/graphql` in the browser to use Apollo Sandbox.

## Using the API

Every operation requires `Authorization: Bearer <token>`, except `createUser` and `login`:

```graphql
mutation {
  createUser(input: { name: "Ana", email: "ana@email.com", password: "12345678", type: Manager }) {
    id
  }
}

mutation {
  login(input: { email: "ana@email.com", password: "12345678" }) {
    token
  }
}
```

The full reference, with examples of every query and mutation, error codes and a map from the former REST API, is in [docs/api-graphql.md](docs/api-graphql.md).

## Tests

Tests run against a dedicated Postgres on port `5433` (configured in [.env.test](.env.test)). The setup refuses to run against any other database.

```bash
npm run db:test:up   # start the test Postgres (in-memory storage)
npm test             # apply migrations and run the suite
```

The suite covers authentication, authorization, input validation, batching of nested relations (no N+1), production behavior and the repositories.

## Project structure

```
src/
├── graphql/        # Apollo Server, Pothos builder, context, auth guard, errors
│   └── modules/    # types, queries and mutations per domain
├── use-cases/      # business rules (one class per use case) + factories
├── repository/     # repository interfaces and Prisma implementations
├── entities/       # domain entities
├── lib/            # JWT and database clients
└── env/            # environment variable validation (Zod)
prisma/             # schema and migrations
test/               # integration tests (GraphQL and repositories)
```

## Security decisions

- Introspection and "Did you mean…?" suggestions are disabled in production so the schema is not exposed.
- Anonymous operations are rejected before argument validation, so unauthenticated callers learn nothing about the expected input.
- Maximum query depth of 7.
- Stack traces are only included in responses in `development`.

## Scripts

| Script                              | What it does                      |
| ----------------------------------- | --------------------------------- |
| `npm run dev`                       | server with hot reload            |
| `npm start`                         | server without watch              |
| `npm test` / `npm run test:watch`   | tests                             |
| `npm run db:test:up`                | start the test Postgres           |
| `npm run db:migrate:deploy`         | apply migrations                  |
| `npm run docker:up` / `docker:down` | start or tear down database + API |
| `npm run lint` / `lint:fix`         | ESLint                            |
| `npm run format`                    | Prettier                          |
