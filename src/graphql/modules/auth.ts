import { z } from "zod";
import { signToken } from "@/lib/jwt";
import { makeAuthenticateUseCase } from "@/use-cases/factory/auth/make-authenticate-usecase";
import { makeFindUserByIdUseCase } from "@/use-cases/factory/user/make-find-user-by-id-usecase";
import { builder } from "../builder";
import { AuthPayload, User } from "../refs";

AuthPayload.implement({
  fields: (t) => ({
    token: t.exposeString("token"),
    user: t.field({ type: User, resolve: (payload) => payload.user }),
  }),
});

const LoginInput = builder
  .inputType("LoginInput", {
    fields: (t) => ({
      email: t.string({ required: true }),
      password: t.string({ required: true }),
    }),
  })
  .validate(
    z.object({
      email: z.string().email(),
      password: z.string().min(8, "Password must be at least 8 characters long"),
    }),
  );

builder.mutationField("login", (t) =>
  t.field({
    type: AuthPayload,
    skipTypeScopes: true,
    args: {
      input: t.arg({ type: LoginInput, required: true }),
    },
    resolve: async (_root, { input }) => {
      const user = await makeAuthenticateUseCase().handle(input.email, input.password);
      return { token: signToken({ id: user.id, type: user.type }), user };
    },
  }),
);

builder.queryField("me", (t) =>
  t.field({
    type: User,
    resolve: (_root, _args, context) => makeFindUserByIdUseCase().handle(context.userId),
  }),
);
