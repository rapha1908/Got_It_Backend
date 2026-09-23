import { hash } from "bcryptjs";
import { z } from "zod";
import { makeCreateUserUseCase } from "@/use-cases/factory/user/make-create-user-usecase";
import { makeFindUserUseCase } from "@/use-cases/factory/user/make-find-user-usecase";
import { builder } from "../builder";
import { User, UserType } from "../refs";

User.implement({
  fields: (t) => ({
    id: t.exposeInt("id"),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    type: t.field({
      type: UserType,
      resolve: (user) => user.type as "Manager" | "Staff",
    }),
  }),
});

const CreateUserInput = builder
  .inputType("CreateUserInput", {
    fields: (t) => ({
      name: t.string({ required: true }),
      email: t.string({ required: true }),
      password: t.string({ required: true }),
      type: t.field({ type: UserType, required: true }),
    }),
  })
  .validate(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(8, "Password must be at least 8 characters long"),
      type: z.enum(["Manager", "Staff"]),
    }),
  );

builder.mutationField("createUser", (t) =>
  t.field({
    type: User,
    skipTypeScopes: true,
    args: {
      input: t.arg({ type: CreateUserInput, required: true }),
    },
    resolve: async (_root, { input }) => {
      const hashedPassword = await hash(input.password, 10);
      return makeCreateUserUseCase().handle(input.name, input.email, hashedPassword, input.type);
    },
  }),
);

builder.queryField("user", (t) =>
  t.field({
    type: User,
    nullable: true,
    args: {
      email: t.arg.string({ required: true, validate: z.string().email() }),
    },
    resolve: (_root, { email }) => makeFindUserUseCase().handle(email),
  }),
);
