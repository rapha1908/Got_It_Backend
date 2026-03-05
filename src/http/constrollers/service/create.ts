import { IService } from "@/entities/models/service.interface";
import { makeCreateServiceUseCase } from "@/use-cases/factory/service/make-create-usecase";
import { Request, Response } from "express";
import { z } from "zod";

export async function createServiceController(req: Request, res: Response) {
  const registerBodySchema = z.object({
    condominium_id: z.coerce.number(),
    staff_id: z.coerce.number(),
    description: z.string().min(1),
    start_date: z.string().date(),
    end_date: z.string().date(),
    status: z.string().min(1),
    price: z.coerce.number().nonnegative(),
  });

  const { condominium_id, staff_id, description, start_date, end_date, status, price } =
    registerBodySchema.parse(req.body);

  const service: IService = {
    condominium_id,
    staff_id,
    description,
    start_date,
    end_date,
    status,
    price,
  };

  const createService = makeCreateServiceUseCase();
  const createdService = await createService.handle(service);
  res.status(201).json({ message: "Service created successfully", data: createdService });
}
