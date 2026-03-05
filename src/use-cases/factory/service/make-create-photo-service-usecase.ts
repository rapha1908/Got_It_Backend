import { PrismaPhotoServiceRepository } from "@/repository/prisma/photo-service.repository";
import { CreatePhotoServiceUseCase } from "@/use-cases/create-photo-service";

export function makeCreatePhotoServiceUseCase() {
  const photoServiceRepository = new PrismaPhotoServiceRepository();
  const createPhotoServiceUseCase = new CreatePhotoServiceUseCase(photoServiceRepository);
  return createPhotoServiceUseCase;
}
