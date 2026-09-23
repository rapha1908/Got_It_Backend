import { makeFindCheckListsByServiceUseCase } from "@/use-cases/factory/service/make-find-check-lists-usecase";
import { Request, Response } from "express";
import { z } from "zod";

export async function findCheckListsController(req: Request, res: Response) {
  const paramsSchema = z.object({
    service_id: z.string().uuid(),
  });

  const { service_id } = paramsSchema.parse(req.params);

  const findCheckLists = makeFindCheckListsByServiceUseCase();
  const checkLists = await findCheckLists.handle(service_id);

  res.status(200).json({ message: "Check lists fetched successfully", data: checkLists });
}
