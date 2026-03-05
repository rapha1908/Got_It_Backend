import { IManager } from "@/entities/models/manager.interface";
import { makeCreateManagerUseCase } from "@/use-cases/factory/manager/make-create-usecase";
import { Request, Response } from "express";
import { z } from "zod";

export async function createManagerController(req: Request, res: Response) {
  const registerBodySchema = z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    nif: z.string().min(1),
    user_id: z.coerce.number(),
  });
  const { name, phone, nif, user_id } = registerBodySchema.parse(req.body);
  const manager: IManager = { name, phone, nif, user_id };
  const createManager = makeCreateManagerUseCase();
  const createdManager = await createManager.handle(manager);
  res.status(201).json({ message: "Manager created successfully", data: createdManager });
}
