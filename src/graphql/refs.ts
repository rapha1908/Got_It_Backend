import { ICheckListItem } from "@/entities/models/check-list-item.interface";
import { ICheckList } from "@/entities/models/check-list.interface";
import { ICondominium } from "@/entities/models/condominium.interface";
import { IManager } from "@/entities/models/manager.interface";
import { IPhotoService } from "@/entities/models/photo-service.interface";
import { IService } from "@/entities/models/service.interface";
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

export const Condominium = builder.objectRef<ICondominium>("Condominium");

export const Service = builder.objectRef<IService>("Service");

export const PhotoService = builder.objectRef<IPhotoService>("PhotoService");

// `items` is present when loaded via findByServiceIds and absent right after createCheckList.
export const CheckList = builder.objectRef<ICheckList & { items?: ICheckListItem[] }>("CheckList");

export const CheckListItem = builder.objectRef<ICheckListItem>("CheckListItem");
