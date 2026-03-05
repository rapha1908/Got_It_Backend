import express from "express";
import { managerRoutes } from "./http/constrollers/manager/routes";
import { userRoutes } from "./http/constrollers/user/routes";
export const app = express();

app.use(express.json());
managerRoutes(app);
userRoutes(app);

export default app;
