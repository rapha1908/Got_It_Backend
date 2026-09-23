import { IPhotoService } from "@/entities/models/photo-service.interface";
import { prisma } from "@/lib/prisma/db";
import { IPhotoServiceRepository } from "../photo-service.repository.interface";

export class PrismaPhotoServiceRepository implements IPhotoServiceRepository {
  async create(photoService: IPhotoService): Promise<IPhotoService> {
    const createdPhotoService = await prisma.photoService.create({
      data: {
        service_id: photoService.service_id,
        photo_url: photoService.photo_url,
      },
    });

    return createdPhotoService;
  }

  async findByServiceId(service_id: string): Promise<IPhotoService[]> {
    return prisma.photoService.findMany({
      where: { service_id },
    });
  }
}
