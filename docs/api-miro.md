# Documentacao da API (Miro)

Este arquivo descreve os endpoints atuais da API e inclui um bloco em formato de mapa mental para uso no Miro.

## Informacoes gerais

- Base URL local: `http://localhost:3000`
- Content-Type: `application/json`
- Formato de sucesso:
  - `201` (criacao) ou `200` (consulta)
  - Corpo: `{ "message": "....", "data": ... }`
- Formato de erro:
  - `400` validacao (Zod): `{ "message": "Invalid request params", "error": "..." }`
  - `404` recurso nao encontrado: `{ "message": "..." }`
  - `500` erro interno: `{ "message": "Internal server error" }`

---

## Usuarios

### POST `/users`

Cria um usuario.

Body:

```json
{
  "name": "Rapha",
  "email": "rapha@email.com",
  "password": "12345678",
  "type": "Manager"
}
```

Regras:
- `name`: string obrigatoria
- `email`: email valido
- `password`: minimo 8 caracteres
- `type`: `Manager` ou `Staff`

Resposta `201`:

```json
{
  "message": "User created successfully",
  "data": {
    "id": 1,
    "name": "Rapha",
    "email": "rapha@email.com",
    "type": "Manager"
  }
}
```

### GET `/users/:email`

Busca usuario por email.

Params:
- `email` (email valido)

Resposta `200`:

```json
{
  "message": "User found successfully",
  "data": {
    "id": 1,
    "name": "Rapha",
    "email": "rapha@email.com",
    "type": "Manager"
  }
}
```

---

## Managers

### POST `/managers`

Cria um manager.

Body:

```json
{
  "name": "Joao",
  "phone": "+244900000000",
  "nif": "123456789",
  "user_id": 1
}
```

Resposta `201`:

```json
{
  "message": "Manager created successfully",
  "data": {
    "id": 1,
    "name": "Joao",
    "phone": "+244900000000",
    "nif": "123456789",
    "user_id": 1
  }
}
```

### GET `/managers/:user_id`

Busca manager pelo `user_id`.

Params:
- `user_id` (numero)

Resposta `200`:

```json
{
  "message": "Manager found successfully",
  "data": {
    "id": 1,
    "name": "Joao",
    "phone": "+244900000000",
    "nif": "123456789",
    "user_id": 1
  }
}
```

---

## Staff

### POST `/staff`

Cria um staff.

Body:

```json
{
  "name": "Maria",
  "phone": "+244911111111",
  "nif": "987654321",
  "user_id": 2
}
```

Resposta `201`:

```json
{
  "message": "Staff created successfully",
  "data": {
    "id": 1,
    "name": "Maria",
    "phone": "+244911111111",
    "nif": "987654321",
    "user_id": 2
  }
}
```

### GET `/staff/:user_id`

Busca staff pelo `user_id`.

Params:
- `user_id` (numero)

Resposta `200`:

```json
{
  "message": "Staff found successfully",
  "data": {
    "id": 1,
    "name": "Maria",
    "phone": "+244911111111",
    "nif": "987654321",
    "user_id": 2
  }
}
```

### POST `/skills`

Cria uma skill.

Body:

```json
{
  "name": "Eletricista"
}
```

Resposta `201`:

```json
{
  "message": "Skill created successfully",
  "data": {
    "id": 1,
    "name": "Eletricista"
  }
}
```

### POST `/staff/:staff_id/skills`

Associa skill a um staff.

Params:
- `staff_id` (numero)

Body:

```json
{
  "skill_id": 1
}
```

Resposta `201`:

```json
{
  "message": "Skill added to staff successfully",
  "data": {
    "id": 1,
    "staff_id": 1,
    "skill_id": 1
  }
}
```

### GET `/staff/:staff_id/skills`

Lista skills de um staff.

Params:
- `staff_id` (numero)

Resposta `200`:

```json
{
  "message": "Staff skills found successfully",
  "data": [
    {
      "id": 1,
      "name": "Eletricista"
    }
  ]
}
```

---

## Condominios

### POST `/condominiums`

Cria um condominio.

Body:

```json
{
  "name": "Condominio Sol",
  "address": "Rua 1",
  "city": "Luanda",
  "state": "Luanda",
  "zip": "1000-000",
  "country": "Angola",
  "manager_id": 1
}
```

Resposta `201`:

```json
{
  "message": "Condominium created successfully",
  "data": {
    "id": 1,
    "name": "Condominio Sol",
    "address": "Rua 1",
    "city": "Luanda",
    "state": "Luanda",
    "zip": "1000-000",
    "country": "Angola",
    "manager_id": 1
  }
}
```

---

## Servicos

### POST `/services`

Cria um servico.

Body:

```json
{
  "condominium_id": 1,
  "staff_id": 1,
  "description": "Reparo eletrico no bloco A",
  "start_date": "2026-03-05",
  "end_date": "2026-03-06",
  "status": "PENDING",
  "price": 2000
}
```

Regras:
- `start_date` e `end_date`: string no formato de data valido
- `price`: numero maior ou igual a 0

Resposta `201`:

```json
{
  "message": "Service created successfully",
  "data": {
    "id": "9f2ce0f7-cc86-4d68-9a0d-57d71e7d4827",
    "condominium_id": 1,
    "staff_id": 1,
    "description": "Reparo eletrico no bloco A",
    "start_date": "2026-03-05T00:00:00.000Z",
    "end_date": "2026-03-06T00:00:00.000Z",
    "status": "PENDING",
    "price": "2000"
  }
}
```

### POST `/services/:service_id/photos`

Adiciona foto em um servico.

Params:
- `service_id` (UUID string)

Body:

```json
{
  "photo_url": "https://cdn.site/fotos/servico-1.jpg"
}
```

Resposta `201`:

```json
{
  "message": "Photo service created successfully",
  "data": {
    "id": 1,
    "service_id": "9f2ce0f7-cc86-4d68-9a0d-57d71e7d4827",
    "photo_url": "https://cdn.site/fotos/servico-1.jpg"
  }
}
```

### POST `/check-lists/:check_list_id/items`

Adiciona item em um check-list.

Params:
- `check_list_id` (numero)

Body:

```json
{
  "description": "Desligar quadro geral",
  "completed": false
}
```

`completed` e opcional (padrao: `false`).

Resposta `201`:

```json
{
  "message": "Check list item created successfully",
  "data": {
    "id": 1,
    "check_list_id": 10,
    "description": "Desligar quadro geral",
    "completed": false
  }
}
```

---

## Estrutura para Miro (mind map)

Copie e cole este bloco em um card no Miro para organizar visualmente:

```text
API Got-It
  Informacoes gerais
    Base URL: http://localhost:3000
    Content-Type: application/json
    Sucesso: 200/201 com { message, data }
    Erros: 400 (validacao), 404 (nao encontrado), 500 (interno)

  Usuarios
    POST /users
      body: name, email, password(>=8), type(Manager|Staff)
      retorno: User criado
    GET /users/:email
      params: email
      retorno: User encontrado

  Managers
    POST /managers
      body: name, phone, nif, user_id
      retorno: Manager criado
    GET /managers/:user_id
      params: user_id
      retorno: Manager encontrado

  Staff
    POST /staff
      body: name, phone, nif, user_id
      retorno: Staff criado
    GET /staff/:user_id
      params: user_id
      retorno: Staff encontrado
    POST /skills
      body: name
      retorno: Skill criada
    POST /staff/:staff_id/skills
      params: staff_id
      body: skill_id
      retorno: Vinculo staff-skill criado
    GET /staff/:staff_id/skills
      params: staff_id
      retorno: Lista de skills

  Condominios
    POST /condominiums
      body: name, address, city, state, zip, country, manager_id
      retorno: Condominio criado

  Servicos
    POST /services
      body: condominium_id, staff_id, description, start_date, end_date, status, price
      retorno: Servico criado
    POST /services/:service_id/photos
      params: service_id (uuid)
      body: photo_url
      retorno: Foto do servico criada
    POST /check-lists/:check_list_id/items
      params: check_list_id
      body: description, completed?
      retorno: Item de check-list criado
```
