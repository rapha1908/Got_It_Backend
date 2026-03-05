import express from "express";
import { managerRoutes } from "./http/constrollers/manager/routes";

export const app = express();

app.use(express.json());
managerRoutes(app);

export default app;
