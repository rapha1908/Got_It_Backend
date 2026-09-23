import { UserEntity } from "@/entities/user.entity";
import { builder } from "./builder";

export const UserType = builder.enumType("UserType", {
  values: ["Manager", "Staff"] as const,
});

export const User = builder.objectRef<UserEntity>("User");

export const AuthPayload = builder.objectRef<{ token: string; user: UserEntity }>("AuthPayload");
