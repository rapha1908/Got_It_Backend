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
