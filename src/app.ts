import express from "express";
import { expressMiddleware } from "@as-integrations/express5";
import { buildContext } from "./graphql/context";
import { createApolloServer } from "./graphql/server";

export async function createApp() {
  const app = express();

  const apollo = createApolloServer();
  await apollo.start();

  app.use(
    "/graphql",
    express.json(),
    expressMiddleware(apollo, {
      context: async ({ req }) => buildContext(req.headers.authorization),
    }),
  );

  return app;
}
