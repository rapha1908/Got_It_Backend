import { IPhotoService } from "@/entities/models/photo-service.interface";
import { makeCreatePhotoServiceUseCase } from "@/use-cases/factory/service/make-create-photo-service-usecase";
import { Request, Response } from "express";
import { z } from "zod";

export async function createPhotoServiceController(req: Request, res: Response) {
  const paramsSchema = z.object({
    service_id: z.string().uuid(),
  });

  const bodySchema = z.object({
    photo_url: z.string().min(1),
  });

  const { service_id } = paramsSchema.parse(req.params);
  const { photo_url } = bodySchema.parse(req.body);

  const payload: IPhotoService = { service_id, photo_url };
  const createPhotoService = makeCreatePhotoServiceUseCase();
  const createdPhotoService = await createPhotoService.handle(payload);

  res.status(201).json({ message: "Photo service created successfully", data: createdPhotoService });
}
