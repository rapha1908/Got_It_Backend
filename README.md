# Got It — Backend (REST, initial version)

> **This branch holds the first version of the API** (REST + raw SQL with `pg`).
> The current version is on the [`GraphQL`](https://github.com/rapha1908/Got_It_Backend/tree/GraphQL) branch, which adds Prisma, a GraphQL API, JWT authentication, password hashing, Docker and an integration test suite.

REST API for managing maintenance services in residential condominiums. Managers run condominiums, staff members are registered with their skills, and services are scheduled at condominiums and assigned to staff.

## Stack

- **Node.js** + **TypeScript**
- **Express 5**
- **PostgreSQL** through the `pg` driver (hand-written SQL)
- **Zod** for request and environment validation

## Architecture

```
src/
├── http/constrollers/  # Express routes and controllers, one folder per resource
├── use-cases/          # business rules (one class per use case) + factories
├── repository/         # repository interfaces and pg implementations
├── entities/           # domain entities
├── lib/pg/             # connection pool
├── utils/              # centralized error handler (ZodError → 400, not found → 404)
└── env/                # environment variable validation (Zod)
data.sql                # database schema
```

Controllers validate input with Zod and call a use case built by a factory, which depends on a repository interface. Only the `pg` implementation of each repository is wired in.

## Running

1. Start a Postgres instance:

   ```bash
   docker run --name got-it-postgres -d -p 5432:5432 \
     -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=gotit \
     postgres:16-alpine
   ```

2. Create the tables:

   ```bash
   docker exec -i got-it-postgres psql -U user -d gotit < data.sql
   ```

3. Create a `.env` file in the project root:

   ```env
   PORT=3000
   NODE_ENV=development

   POSTGRES_USER=user
   POSTGRES_PASSWORD=password
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=gotit
   ```

4. Install dependencies and start the server:

   ```bash
   npm install
   npm run dev
   ```

The API runs at `http://localhost:3000`.

## Endpoints

| Method | Path                      | Description                       |
| ------ | ------------------------- | --------------------------------- |
| POST   | `/users`                  | create a user (`Manager`/`Staff`) |
| GET    | `/users/:email`           | find a user by email              |
| POST   | `/managers`               | create a manager profile          |
| GET    | `/managers/:user_id`      | find a manager by user id         |
| POST   | `/staff`                  | create a staff profile            |
| GET    | `/staff/:user_id`         | find a staff member by user id    |
| POST   | `/skills`                 | create a skill                    |
| POST   | `/staff/:staff_id/skills` | add a skill to a staff member     |
| GET    | `/staff/:staff_id/skills` | list a staff member's skills      |
| POST   | `/condominiums`           | create a condominium              |
| POST   | `/services`               | create a service                  |

Example:

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana","email":"ana@email.com","password":"12345678","type":"Manager"}'
```

## Known limitations of this version

These were addressed on the `GraphQL` branch:

- No authentication; every endpoint is public.
- Passwords are stored in plain text.
- No automated tests.
- Schema managed by a single SQL file instead of migrations.

## Scripts

| Script             | What it does           |
| ------------------ | ---------------------- |
| `npm run dev`      | server with hot reload |
| `npm run lint`     | ESLint                 |
| `npm run lint:fix` | ESLint with auto-fix   |
| `npm run format`   | Prettier               |
