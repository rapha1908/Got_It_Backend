import { PrismaPhotoServiceRepository } from "@/repository/prisma/photo-service.repository";
import { FindPhotosByServiceUseCase } from "@/use-cases/find-photos-by-service";

export function makeFindPhotosByServiceUseCase() {
  const photoServiceRepository = new PrismaPhotoServiceRepository();
  const findPhotosByServiceUseCase = new FindPhotosByServiceUseCase(photoServiceRepository);
  return findPhotosByServiceUseCase;
}
