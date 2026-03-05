import { z } from "zod";
import { Request, Response } from "express";
import { makeCreateUserUseCase } from "@/use-cases/factory/user/make-create-user-usecase";

export async function createUserController(req: Request, res: Response) {
  const registerBodySchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    type: z.enum(["Manager", "Staff"]),
  });

  const { name, email, password, type } = registerBodySchema.parse(req.body);
  const createUser = makeCreateUserUseCase();
  const user = await createUser.handle(name, email, password, type);
  res.status(201).json({ message: "User created successfully", data: user });
}
