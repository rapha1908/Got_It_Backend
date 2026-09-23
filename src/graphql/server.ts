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
