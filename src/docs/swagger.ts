import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Got-It API",
    version: "1.0.0",
    description: "Documentacao da API do backend Got-It.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor local",
    },
  ],
  tags: [
    { name: "Users" },
    { name: "Managers" },
    { name: "Staff" },
    { name: "Skills" },
    { name: "Condominiums" },
    { name: "Services" },
    { name: "CheckLists" },
  ],
  components: {
    schemas: {
      ApiSuccess: {
        type: "object",
        properties: {
          message: { type: "string" },
          data: {},
        },
      },
      Error400: {
        type: "object",
        properties: {
          message: { type: "string", example: "Invalid request params" },
          error: { type: "string" },
        },
      },
      Error404: {
        type: "object",
        properties: {
          message: { type: "string", example: "Resource not found" },
        },
      },
      Error500: {
        type: "object",
        properties: {
          message: { type: "string", example: "Internal server error" },
        },
      },
      CreateUserBody: {
        type: "object",
        required: ["name", "email", "password", "type"],
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          type: { type: "string", enum: ["Manager", "Staff"] },
        },
      },
      CreateManagerBody: {
        type: "object",
        required: ["name", "phone", "nif", "user_id"],
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          nif: { type: "string" },
          user_id: { type: "integer" },
        },
      },
      CreateStaffBody: {
        type: "object",
        required: ["name", "phone", "nif", "user_id"],
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          nif: { type: "string" },
          user_id: { type: "integer" },
        },
      },
      CreateSkillBody: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
        },
      },
      AddSkillToStaffBody: {
        type: "object",
        required: ["skill_id"],
        properties: {
          skill_id: { type: "integer" },
        },
      },
      CreateCondominiumBody: {
        type: "object",
        required: ["name", "address", "city", "state", "zip", "country", "manager_ids"],
        properties: {
          name: { type: "string" },
          address: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          zip: { type: "string" },
          country: { type: "string" },
          manager_ids: {
            type: "array",
            minItems: 1,
            items: { type: "integer" },
          },
        },
      },
      CreateServiceBody: {
        type: "object",
        required: [
          "condominium_id",
          "staff_id",
          "description",
          "start_date",
          "end_date",
          "status",
          "price",
        ],
        properties: {
          condominium_id: { type: "integer" },
          staff_id: { type: "integer" },
          description: { type: "string" },
          start_date: { type: "string", format: "date" },
          end_date: { type: "string", format: "date" },
          status: { type: "string" },
          price: { type: "number", minimum: 0 },
        },
      },
      CreatePhotoServiceBody: {
        type: "object",
        required: ["photo_url"],
        properties: {
          photo_url: { type: "string" },
        },
      },
      CreateCheckListItemBody: {
        type: "object",
        required: ["description"],
        properties: {
          description: { type: "string" },
          completed: { type: "boolean", default: false },
        },
      },
    },
  },
  paths: {
    "/users": {
      post: {
        tags: ["Users"],
        summary: "Criar usuario",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUserBody" },
            },
          },
        },
        responses: {
          "201": {
            description: "Usuario criado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccess" },
              },
            },
          },
          "400": {
            description: "Dados invalidos",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error400" },
              },
            },
          },
          "500": {
            description: "Erro interno",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error500" },
              },
            },
          },
        },
      },
    },
    "/users/{email}": {
      get: {
        tags: ["Users"],
        summary: "Buscar usuario por email",
        parameters: [
          {
            name: "email",
            in: "path",
            required: true,
            schema: { type: "string", format: "email" },
          },
        ],
        responses: {
          "200": {
            description: "Usuario encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccess" },
              },
            },
          },
          "404": {
            description: "Usuario nao encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error404" },
              },
            },
          },
        },
      },
    },
    "/managers": {
      post: {
        tags: ["Managers"],
        summary: "Criar manager",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateManagerBody" },
            },
          },
        },
        responses: {
          "201": {
            description: "Manager criado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccess" },
              },
            },
          },
          "400": {
            description: "Dados invalidos",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error400" },
              },
            },
          },
        },
      },
    },
    "/managers/{user_id}": {
      get: {
        tags: ["Managers"],
        summary: "Buscar manager por user_id",
        parameters: [
          {
            name: "user_id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "Manager encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccess" },
              },
            },
          },
          "404": {
            description: "Manager nao encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error404" },
              },
            },
          },
        },
      },
    },
    "/staff": {
      post: {
        tags: ["Staff"],
        summary: "Criar staff",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateStaffBody" },
            },
          },
        },
        responses: {
          "201": {
            description: "Staff criado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccess" },
              },
            },
          },
          "400": {
            description: "Dados invalidos",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error400" },
              },
            },
          },
        },
      },
    },
    "/staff/{user_id}": {
      get: {
        tags: ["Staff"],
        summary: "Buscar staff por user_id",
        parameters: [
          {
            name: "user_id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "Staff encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccess" },
              },
            },
          },
        },
      },
    },
    "/skills": {
      post: {
        tags: ["Skills"],
        summary: "Criar skill",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateSkillBody" },
            },
          },
        },
        responses: {
          "201": {
            description: "Skill criada com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccess" },
              },
            },
          },
        },
      },
    },
    "/staff/{staff_id}/skills": {
      post: {
        tags: ["Staff", "Skills"],
        summary: "Associar skill a um staff",
        parameters: [
          {
            name: "staff_id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AddSkillToStaffBody" },
            },
          },
        },
        responses: {
          "201": {
            description: "Associacao criada com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccess" },
              },
            },
          },
        },
      },
      get: {
        tags: ["Staff", "Skills"],
        summary: "Listar skills de um staff",
        parameters: [
          {
            name: "staff_id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "Skills encontradas",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccess" },
              },
            },
          },
        },
      },
    },
    "/condominiums": {
      post: {
        tags: ["Condominiums"],
        summary: "Criar condominio",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateCondominiumBody" },
            },
          },
        },
        responses: {
          "201": {
            description: "Condominio criado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccess" },
              },
            },
          },
        },
      },
    },
    "/services": {
      post: {
        tags: ["Services"],
        summary: "Criar servico",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateServiceBody" },
            },
          },
        },
        responses: {
          "201": {
            description: "Servico criado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccess" },
              },
            },
          },
        },
      },
    },
    "/services/{service_id}/photos": {
      post: {
        tags: ["Services"],
        summary: "Criar foto de um servico",
        parameters: [
          {
            name: "service_id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreatePhotoServiceBody" },
            },
          },
        },
        responses: {
          "201": {
            description: "Foto do servico criada com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccess" },
              },
            },
          },
        },
      },
    },
    "/check-lists/{check_list_id}/items": {
      post: {
        tags: ["CheckLists"],
        summary: "Criar item de check-list",
        parameters: [
          {
            name: "check_list_id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateCheckListItemBody" },
            },
          },
        },
        responses: {
          "201": {
            description: "Item de check-list criado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccess" },
              },
            },
          },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: [],
});
