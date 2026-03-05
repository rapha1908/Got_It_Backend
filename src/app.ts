import express, { NextFunction, Request, Response } from "express";
import { managerRoutes } from "./http/constrollers/manager/routes";
import { userRoutes } from "./http/constrollers/user/routes";
import { ZodError } from "zod";
import { env } from "./env";
import { ResourceNotFoundError } from "./use-cases/errors/resource-not-found-erro";
export const app = express();

app.use(express.json());
managerRoutes(app);
userRoutes(app);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  void _next;
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
});

export default app;
