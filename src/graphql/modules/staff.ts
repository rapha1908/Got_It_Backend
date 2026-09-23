import { z } from "zod";
import { ISkillOfStaff } from "@/entities/models/staff-skill.interface";
import { PrismaStaffSkillRepository } from "@/repository/prisma/staff-skill.repository";
import { PrismaStaffRepository } from "@/repository/prisma/staff.repository";
import { PrismaUserRepository } from "@/repository/prisma/user.repository";
import { makeAddSkillToStaffUseCase } from "@/use-cases/factory/staff/make-add-skill-usecase";
import { makeCreateSkillUseCase } from "@/use-cases/factory/staff/make-create-skill-usecase";
import { makeCreateStaffUseCase } from "@/use-cases/factory/staff/make-create-usecase";
import { makeFindStaffByIdUseCase } from "@/use-cases/factory/staff/make-find-staff-by-id-usecase";
import { makeFindStaffUseCase } from "@/use-cases/factory/staff/make-find-usecase";
import { builder } from "../builder";
import { Skill, Staff, User } from "../refs";
import { orderByKeys, orderByKeysOrError } from "../utils/order-by-keys";

const staffRepository = new PrismaStaffRepository();
const staffSkillRepository = new PrismaStaffSkillRepository();
const userRepository = new PrismaUserRepository();

Skill.implement({
  fields: (t) => ({
    id: t.exposeInt("id"),
    name: t.exposeString("name"),
  }),
});

Staff.implement({
  fields: (t) => ({
    id: t.exposeInt("id"),
    userId: t.exposeInt("user_id"),
    name: t.exposeString("name"),
    phone: t.exposeString("phone"),
    nif: t.exposeString("nif"),
    user: t.loadable({
      type: User,
      load: async (ids: number[]) => orderByKeysOrError(ids, await userRepository.findByIds(ids), (user) => user.id),
      resolve: (staff) => staff.user_id,
    }),
    skills: t.loadableGroup({
      type: Skill,
      load: (staffIds: number[]) => staffSkillRepository.findSkillsByStaffIds(staffIds),
      // Rows come from findSkillsByStaffIds, so they carry the staff_id they were loaded for.
      group: (skill) => (skill as ISkillOfStaff).staff_id,
      resolve: (staff) => staff.id,
    }),
  }),
});

builder.objectField(User, "staff", (t) =>
  t.loadable({
    type: Staff,
    nullable: true,
    load: async (userIds: number[]) =>
      orderByKeys(userIds, await staffRepository.findByUserIds(userIds), (staff) => staff.user_id),
    resolve: (user) => user.id,
  }),
);

const CreateStaffInput = builder
  .inputType("CreateStaffInput", {
    fields: (t) => ({
      userId: t.int({ required: true }),
      name: t.string({ required: true }),
      phone: t.string({ required: true }),
      nif: t.string({ required: true }),
    }),
  })
  .validate(
    z.object({
      userId: z.number().int().positive(),
      name: z.string().min(1),
      phone: z.string().min(1),
      nif: z.string().min(1),
    }),
  );

const CreateSkillInput = builder
  .inputType("CreateSkillInput", {
    fields: (t) => ({
      name: t.string({ required: true }),
    }),
  })
  .validate(z.object({ name: z.string().min(1) }));

const AddSkillToStaffInput = builder
  .inputType("AddSkillToStaffInput", {
    fields: (t) => ({
      staffId: t.int({ required: true }),
      skillId: t.int({ required: true }),
    }),
  })
  .validate(
    z.object({
      staffId: z.number().int().positive(),
      skillId: z.number().int().positive(),
    }),
  );

builder.mutationField("createStaff", (t) =>
  t.field({
    type: Staff,
    args: {
      input: t.arg({ type: CreateStaffInput, required: true }),
    },
    resolve: (_root, { input }) =>
      makeCreateStaffUseCase().handle({
        name: input.name,
        phone: input.phone,
        nif: input.nif,
        user_id: input.userId,
      }),
  }),
);

builder.mutationField("createSkill", (t) =>
  t.field({
    type: Skill,
    args: {
      input: t.arg({ type: CreateSkillInput, required: true }),
    },
    resolve: (_root, { input }) => makeCreateSkillUseCase().handle({ name: input.name }),
  }),
);

builder.mutationField("addSkillToStaff", (t) =>
  t.field({
    type: Staff,
    args: {
      input: t.arg({ type: AddSkillToStaffInput, required: true }),
    },
    resolve: async (_root, { input }) => {
      await makeAddSkillToStaffUseCase().handle({ staff_id: input.staffId, skill_id: input.skillId });
      return makeFindStaffByIdUseCase().handle(input.staffId);
    },
  }),
);

builder.queryField("staff", (t) =>
  t.field({
    type: Staff,
    args: {
      userId: t.arg.int({ required: true }),
    },
    resolve: (_root, { userId }) => makeFindStaffUseCase().handle(userId),
  }),
);
