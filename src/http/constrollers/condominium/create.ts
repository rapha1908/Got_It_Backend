import { ICondominium } from "@/entities/models/condominium.interface";
import { makeCreateCondominiumUseCase } from "@/use-cases/factory/condominium/make-create-usecase";
import { Request, Response } from "express";
import { z } from "zod";

export async function createCondominiumController(req: Request, res: Response) {
  const registerBodySchema = z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    country: z.string().min(1),
    manager_id: z.coerce.number(),
  });

  const { name, address, city, state, zip, country, manager_id } = registerBodySchema.parse(req.body);

  const condominium: ICondominium = { name, address, city, state, zip, country, manager_id };
  const createCondominium = makeCreateCondominiumUseCase();
  const createdCondominium = await createCondominium.handle(condominium);
  res.status(201).json({ message: "Condominium created successfully", data: createdCondominium });
}
