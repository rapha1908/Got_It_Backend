import { z } from "zod";
import { Request, Response } from "express";
import { makeFindManagerUseCase } from "@/use-cases/factory/manager/make-find-usecase";

export async function findManagerController(req: Request, res: Response) {
  const paramsSchema = z.object({
    user_id: z.coerce.number(),
  });
  try {
    const { user_id } = paramsSchema.parse(req.params);
    const findWithManager = makeFindManagerUseCase();
    const user = await findWithManager.handle(user_id);
    res.status(200).json({ message: "Manager found successfully", data: user });
  } catch (error) {
    res.status(400).json({ message: "Invalid request params", error: error.message });
  }
}
