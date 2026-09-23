import { IManager } from "@/entities/models/manager.interface";
import { ISkill } from "@/entities/models/skill.interface";
import { IStaff } from "@/entities/models/staff.interface";
import { UserEntity } from "@/entities/user.entity";
import { builder } from "./builder";

export const UserType = builder.enumType("UserType", {
  values: ["Manager", "Staff"] as const,
});

export const User = builder.objectRef<UserEntity>("User");

export const AuthPayload = builder.objectRef<{ token: string; user: UserEntity }>("AuthPayload");

export const Manager = builder.objectRef<IManager>("Manager");

export const Staff = builder.objectRef<IStaff>("Staff");

export const Skill = builder.objectRef<ISkill>("Skill");
