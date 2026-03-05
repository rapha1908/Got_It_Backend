import { z } from "zod";
import { Request, Response } from "express";
import { UserRepository } from "@/repository/user.repository";
import { FindUserUseCase } from "@/use-cases/find-user";

const paramsSchema = z.object({
  email: z.string().email(),
});

export async function findUserController(req: Request, res: Response) {
  try {
    const { email } = paramsSchema.parse(req.params);
    const userRepository = new UserRepository();
    const findUser = new FindUserUseCase(userRepository);
    const user = await findUser.handle(email);
    res.status(200).json({ message: "User found successfully", data: user });
  } catch (error) {
    res.status(400).json({ message: "Invalid request params", error: error.message });
  }
}
