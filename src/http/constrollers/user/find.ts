import { z } from "zod";
import { Request, Response } from "express";
import { makeFindUserUseCase } from "@/use-cases/factory/user/make-find-user-usecase";

const paramsSchema = z.object({
  email: z.string().email(),
});

export async function findUserController(req: Request, res: Response) {
  const { email } = paramsSchema.parse(req.params);
  const findUser = makeFindUserUseCase();
  const user = await findUser.handle(email);
  res.status(200).json({ message: "User found successfully", data: user });
}
