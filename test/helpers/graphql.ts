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
