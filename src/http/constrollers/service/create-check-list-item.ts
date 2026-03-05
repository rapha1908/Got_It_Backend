import { ICheckListItem } from "@/entities/models/check-list-item.interface";
import { makeCreateCheckListItemUseCase } from "@/use-cases/factory/service/make-create-check-list-item-usecase";
import { Request, Response } from "express";
import { z } from "zod";

export async function createCheckListItemController(req: Request, res: Response) {
  const paramsSchema = z.object({
    check_list_id: z.coerce.number(),
  });

  const bodySchema = z.object({
    description: z.string().min(1),
    completed: z.boolean().optional().default(false),
  });

  const { check_list_id } = paramsSchema.parse(req.params);
  const { description, completed } = bodySchema.parse(req.body);

  const payload: ICheckListItem = { check_list_id, description, completed };
  const createCheckListItem = makeCreateCheckListItemUseCase();
  const createdCheckListItem = await createCheckListItem.handle(payload);

  res.status(201).json({ message: "Check list item created successfully", data: createdCheckListItem });
}
