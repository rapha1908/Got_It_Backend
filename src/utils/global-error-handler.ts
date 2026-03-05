import { env } from "@/env";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-erro";
import { Response } from "express";
import { ZodError } from "zod";

export function globalErrorHandler(error: unknown, res: Response) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Invalid request params",
      error: error.message,
    });
  }
  if (error instanceof ResourceNotFoundError) {
    return res.status(404).json({
      message: error.message,
    });
  }
  if (env.NODE_ENV === "development") {
    console.error(error);
  }
  return res.status(500).json({
    message: "Internal server error",
  });
}
