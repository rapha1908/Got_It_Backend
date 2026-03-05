import express, { NextFunction, Request, Response } from "express";
import { managerRoutes } from "./http/constrollers/manager/routes";
import { userRoutes } from "./http/constrollers/user/routes";
import { staffRoutes } from "./http/constrollers/staff/routes";
import { globalErrorHandler } from "./utils/global-error-handler";
export const app = express();

app.use(express.json());
managerRoutes(app);
userRoutes(app);
staffRoutes(app);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  void _next;
  return globalErrorHandler(error, res);
});

export default app;
