import { z } from "zod";
import { Request, Response } from "express";
import { UserRepository } from "@/repository/user.repository";
import { CreateUserUseCase } from "@/use-cases/create-user";

export async function createUserController(req: Request, res: Response) {
  const registerBodySchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    type: z.enum(["Manager", "Staff"]),
  });

  try {
    const { name, email, password, type } = registerBodySchema.parse(req.body);
    const userRepository = new UserRepository();
    const createUser = new CreateUserUseCase(userRepository);
    const user = await createUser.handle(name, email, password, type);
    res.status(201).json({ message: "User created successfully", data: user });
  } catch (error) {
    res.status(400).json({ message: "Invalid request body", error: error.message });
  }
}
