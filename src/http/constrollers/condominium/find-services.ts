import { makeFindServicesByCondominiumUseCase } from "@/use-cases/factory/condominium/make-find-services-usecase";
import { Request, Response } from "express";
import { z } from "zod";

export async function findServicesByCondominiumController(req: Request, res: Response) {
  const paramsSchema = z.object({
    condominium_id: z.coerce.number(),
  });

  const { condominium_id } = paramsSchema.parse(req.params);

  const findServices = makeFindServicesByCondominiumUseCase();
  const services = await findServices.handle(condominium_id);

  res.status(200).json({ message: "Services fetched successfully", data: services });
}
