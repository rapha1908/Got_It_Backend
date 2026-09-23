import { builder } from "./builder";
import "./modules/auth";
import "./modules/user";
import "./modules/manager";
import "./modules/staff";

export const schema = builder.toSchema();
