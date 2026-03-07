import express, { NextFunction, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { managerRoutes } from "./http/constrollers/manager/routes";
import { userRoutes } from "./http/constrollers/user/routes";
import { staffRoutes } from "./http/constrollers/staff/routes";
import { condominiumRoutes } from "./http/constrollers/condominium/routes";
import { serviceRoutes } from "./http/constrollers/service/routes";
import { authRoutes } from "./http/constrollers/auth/routes";
import { globalErrorHandler } from "./utils/global-error-handler";
import { swaggerSpec } from "./docs/swagger";
import { ensureAuth } from "./http/middlewares/ensure-auth";
export const app = express();


app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/docs.json", (_req: Request, res: Response) => {
  return res.status(200).json(swaggerSpec);
});

app.use(ensureAuth);

authRoutes(app);
managerRoutes(app);
userRoutes(app);
staffRoutes(app);
condominiumRoutes(app);
serviceRoutes(app);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  void _next;
  return globalErrorHandler(error, res);
});

export default app;
