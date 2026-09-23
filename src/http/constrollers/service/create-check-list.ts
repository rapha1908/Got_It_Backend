import { ICheckList } from "@/entities/models/check-list.interface";
import { makeCreateCheckListUseCase } from "@/use-cases/factory/service/make-create-check-list-usecase";
import { Request, Response } from "express";
import { z } from "zod";

export async function createCheckListController(req: Request, res: Response) {
  const paramsSchema = z.object({
    service_id: z.string().uuid(),
  });

  const bodySchema = z.object({
    description: z.string().min(1),
  });

  const { service_id } = paramsSchema.parse(req.params);
  const { description } = bodySchema.parse(req.body);

  const payload: ICheckList = { service_id, description };
  const createCheckList = makeCreateCheckListUseCase();
  const createdCheckList = await createCheckList.handle(payload);

  res.status(201).json({ message: "Check list created successfully", data: createdCheckList });
}
