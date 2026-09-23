import { beforeAll, describe, expect, it } from "vitest";
import { execute } from "../helpers/graphql";

// The schema is read through introspection instead of importing `graphql` here: Vitest would load
// the ESM build while Pothos uses the CJS one, and graphql-js refuses to mix the two instances.

type TypeRef = { kind: string; name: string | null; ofType: TypeRef | null };
type IntrospectedArg = { name: string; type: TypeRef };
type IntrospectedField = { name: string; args: IntrospectedArg[]; type: TypeRef };
type IntrospectedType = {
  name: string;
  kind: string;
  fields: IntrospectedField[] | null;
  inputFields: IntrospectedArg[] | null;
  enumValues: { name: string }[] | null;
};

const TYPE_REF = "kind name ofType { kind name ofType { kind name ofType { kind name } } }";

const INTROSPECTION = `{
  __schema {
    types {
      name
      kind
      fields { name type { ${TYPE_REF} } args { name type { ${TYPE_REF} } } }
      inputFields { name type { ${TYPE_REF} } }
      enumValues { name }
    }
  }
}`;

const PUBLIC_FIELDS = ["Mutation.login", "Mutation.createUser"];

let types: Map<string, IntrospectedType>;

function literalFor(ref: TypeRef): string {
  if (ref.kind === "NON_NULL") return literalFor(ref.ofType!);
  if (ref.kind === "LIST") return `[${literalFor(ref.ofType!)}]`;

  const type = types.get(ref.name!)!;
  if (type.kind === "ENUM") return type.enumValues![0].name;
  if (type.kind === "INPUT_OBJECT") {
    return `{ ${type.inputFields!.map((field) => `${field.name}: ${literalFor(field.type)}`).join(", ")} }`;
  }
  return { Int: "1", Float: "1", Boolean: "true" }[ref.name!] ?? `"x"`;
}

function namedKind(ref: TypeRef): string {
  return ref.ofType ? namedKind(ref.ofType) : ref.kind;
}

function rootOperations() {
  return (["Query", "Mutation"] as const).flatMap((root) =>
    types.get(root)!.fields!.map((field) => {
      const args = field.args.map((arg) => `${arg.name}: ${literalFor(arg.type)}`).join(", ");
      const selection = namedKind(field.type) === "OBJECT" ? " { __typename }" : "";
      const keyword = root === "Query" ? "query" : "mutation";
      return {
        name: `${root}.${field.name}`,
        operation: `${keyword} { ${field.name}${args ? `(${args})` : ""}${selection} }`,
      };
    }),
  );
}

describe("authorization", () => {
  beforeAll(async () => {
    const result = await execute(INTROSPECTION);
    types = new Map((result.data?.__schema.types as IntrospectedType[]).map((type) => [type.name, type]));
  });

  it("every root field except login and createUser requires a token", async () => {
    const operations = rootOperations();
    expect(operations.map((op) => op.name)).toEqual(expect.arrayContaining(PUBLIC_FIELDS));

    const failures: string[] = [];

    for (const { name, operation } of operations) {
      const result = await execute(operation);
      const code = result.errors?.[0]?.extensions?.code;
      const isPublic = PUBLIC_FIELDS.includes(name);

      if (!isPublic && code !== "UNAUTHENTICATED") failures.push(`${name} is reachable without a token (got ${code ?? "data"})`);
      if (isPublic && code === "UNAUTHENTICATED") failures.push(`${name} should be public`);
    }

    expect(failures).toEqual([]);
  });

  it.each([
    ["a named fragment", `query { ...Root } fragment Root on Query { condominiums { id } }`],
    ["an inline fragment", `query { ... on Query { condominiums { id } } }`],
    ["a public field next to a protected one", `mutation { login(input: { email: "a@b.co", password: "12345678" }) { token } createSkill(input: { name: "x" }) { id } }`],
  ])("rejects protected fields hidden behind %s", async (_label, operation) => {
    const result = await execute(operation);
    expect(result.errors?.[0].extensions?.code).toBe("UNAUTHENTICATED");
  });

  it("still validates input of public fields for anonymous callers", async () => {
    const result = await execute(`mutation { login(input: { email: "not-an-email", password: "12345678" }) { token } }`);
    expect(result.errors?.[0].extensions?.code).toBe("BAD_USER_INPUT");
  });
});
