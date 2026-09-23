import { builder } from "./builder";
import "./modules/auth";
import "./modules/user";

export const schema = builder.toSchema();
