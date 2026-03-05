import { ManagerEntity } from "@/entities/manager.entity";
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
  const createManager = makeCreateManagerUseCase();
  const createdManager = await createManager.handle(new ManagerEntity(name, phone, nif, user_id));
  res.status(201).json({ message: "Manager created successfully", data: createdManager });
}
