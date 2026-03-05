import { env } from "@/env";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-erro";
import { Response } from "express";
import { ZodError } from "zod";

type ErrorPayload = {
  status: number;
  body: Record<string, unknown>;
};

interface ErrorHandlerMap {
  [key: string]: (error: unknown) => ErrorPayload;
  ZodError: (error: ZodError) => ErrorPayload;
  ResourceNotFoundError: (error: ResourceNotFoundError) => ErrorPayload;
}

const errorHandlerMap: ErrorHandlerMap = {
  ZodError: (error: ZodError) => {
    return {
      status: 400,
      body: {
        message: "Invalid request params",
        error: error.message,
      },
    };
  },
  ResourceNotFoundError: (error: ResourceNotFoundError) => {
    return {
      status: 404,
      body: {
        message: error.message,
      },
    };
  },
};

export function globalErrorHandler(error: unknown, res: Response) {
  const errorName = error instanceof Error ? error.constructor.name : "";
  const errorHandler = errorHandlerMap[errorName];

  if (errorHandler) {
    const handledError = errorHandler(error);
    return res.status(handledError.status).json(handledError.body);
  }

  if (env.NODE_ENV === "development") {
    console.error(error);
  }

  return res.status(500).json({
    message: "Internal server error",
  });
}
