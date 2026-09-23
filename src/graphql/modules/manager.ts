import { z } from "zod";
import { PrismaManagerRepository } from "@/repository/prisma/manager.repository";
import { PrismaUserRepository } from "@/repository/prisma/user.repository";
import { makeCreateManagerUseCase } from "@/use-cases/factory/manager/make-create-usecase";
import { makeFindManagerUseCase } from "@/use-cases/factory/manager/make-find-usecase";
import { builder } from "../builder";
import { Manager, User } from "../refs";
import { orderByKeys, orderByKeysOrError } from "../utils/order-by-keys";

const managerRepository = new PrismaManagerRepository();
const userRepository = new PrismaUserRepository();

Manager.implement({
  fields: (t) => ({
    id: t.exposeInt("id"),
    userId: t.exposeInt("user_id"),
    name: t.exposeString("name"),
    phone: t.exposeString("phone"),
    nif: t.exposeString("nif"),
    user: t.loadable({
      type: User,
      load: async (ids: number[]) => orderByKeysOrError(ids, await userRepository.findByIds(ids), (user) => user.id),
      resolve: (manager) => manager.user_id,
    }),
  }),
});

builder.objectField(User, "manager", (t) =>
  t.loadable({
    type: Manager,
    nullable: true,
    load: async (userIds: number[]) =>
      orderByKeys(userIds, await managerRepository.findByUserIds(userIds), (manager) => manager.user_id),
    resolve: (user) => user.id,
  }),
);

const CreateManagerInput = builder
  .inputType("CreateManagerInput", {
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

builder.mutationField("createManager", (t) =>
  t.field({
    type: Manager,
    args: {
      input: t.arg({ type: CreateManagerInput, required: true }),
    },
    resolve: (_root, { input }) =>
      makeCreateManagerUseCase().handle({
        name: input.name,
        phone: input.phone,
        nif: input.nif,
        user_id: input.userId,
      }),
  }),
);

builder.queryField("manager", (t) =>
  t.field({
    type: Manager,
    args: {
      userId: t.arg.int({ required: true }),
    },
    resolve: (_root, { userId }) => makeFindManagerUseCase().handle(userId),
  }),
);
