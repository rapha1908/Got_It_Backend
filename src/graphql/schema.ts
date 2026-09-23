import { builder } from "./builder";
import "./modules/auth";
import "./modules/user";
import "./modules/manager";
import "./modules/staff";
import "./modules/condominium";
import "./modules/service";

export const schema = builder.toSchema();
