import { makeFindPhotosByServiceUseCase } from "@/use-cases/factory/service/make-find-photos-usecase";
import { Request, Response } from "express";
import { z } from "zod";

export async function findPhotosController(req: Request, res: Response) {
  const paramsSchema = z.object({
    service_id: z.string().uuid(),
  });

  const { service_id } = paramsSchema.parse(req.params);

  const findPhotos = makeFindPhotosByServiceUseCase();
  const photos = await findPhotos.handle(service_id);

  res.status(200).json({ message: "Photos fetched successfully", data: photos });
}
