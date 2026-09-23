import { unwrapResolverError } from "@apollo/server/errors";
import { GraphQLFormattedError } from "graphql";
import { env } from "@/env";

type HandledError = {
  code: string;
  message: string;
};

const prismaErrorMap: Record<string, HandledError> = {
  P2002: { code: "BAD_USER_INPUT", message: "Resource already exists" },
  P2003: { code: "BAD_USER_INPUT", message: "Related resource not found" },
};

const errorHandlerMap: Record<string, (error: Error) => HandledError | undefined> = {
  ResourceNotFoundError: (error) => ({ code: "NOT_FOUND", message: error.message }),
  InvalidCredentialsError: (error) => ({ code: "UNAUTHENTICATED", message: error.message }),
  InputValidationError: (error) => ({ code: "BAD_USER_INPUT", message: error.message }),
  ZodError: (error) => ({ code: "BAD_USER_INPUT", message: error.message }),
  PrismaClientKnownRequestError: (error) => prismaErrorMap[(error as Error & { code: string }).code],
};

export function formatError(formattedError: GraphQLFormattedError, error: unknown): GraphQLFormattedError {
  const code = formattedError.extensions?.code;

  // Errors that already carry a meaningful code (auth scopes, GraphQL validation, parse errors) pass through.
  if (code && code !== "INTERNAL_SERVER_ERROR") {
    return formattedError;
  }

  const originalError = unwrapResolverError(error);
  const handler = originalError instanceof Error ? errorHandlerMap[originalError.constructor.name] : undefined;
  const handled = handler?.(originalError as Error);

  if (handled) {
    return {
      message: handled.message,
      locations: formattedError.locations,
      path: formattedError.path,
      extensions: { code: handled.code },
    };
  }

  if (env.NODE_ENV === "development") {
    console.error(originalError);
  }

  return {
    message: "Internal server error",
    locations: formattedError.locations,
    path: formattedError.path,
    extensions: { code: "INTERNAL_SERVER_ERROR" },
  };
}
