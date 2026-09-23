import { ApolloServer } from "@apollo/server";
import depthLimit from "graphql-depth-limit";
import { env } from "@/env";
import { authGuardPlugin } from "./auth-guard";
import { Context } from "./context";
import { formatError } from "./errors";
import { schema } from "./schema";

export const MAX_QUERY_DEPTH = 7;

export function createApolloServer() {
  return new ApolloServer<Context>({
    schema,
    formatError,
    plugins: [authGuardPlugin],
    validationRules: [depthLimit(MAX_QUERY_DEPTH)],
    introspection: env.NODE_ENV !== "production",
    // Without this, "Did you mean ...?" validation hints reveal the schema even with introspection off.
    hideSchemaDetailsFromClientErrors: env.NODE_ENV === "production",
    includeStacktraceInErrorResponses: env.NODE_ENV === "development",
  });
}
