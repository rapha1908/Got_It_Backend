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
  // The project compiles with `strict: false`; Pothos requires acknowledging that explicitly.
  notStrict: "Pothos may not work correctly when strict mode is not enabled in tsconfig.json",
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
