import { UserRepository } from "@/repository/user.repository";
import { FindWithManagerUseCase } from "@/use-cases/find-with-manager";
import { z } from "zod";
import { Request, Response } from "express";

export async function findManagerController(req: Request, res: Response) {
  const paramsSchema = z.object({
    user_id: z.coerce.number(),
  });

  const { user_id } = paramsSchema.parse(req.params);
  try {
    const userRepository = new UserRepository();
    const findWithManager = new FindWithManagerUseCase(userRepository);
    const user = await findWithManager.handle(user_id);
    res.status(200).json({ message: "Manager found successfully", data: user });
  } catch (error) {
    res.status(400).json({ message: "Invalid request params", error: error.message });
  }
}
