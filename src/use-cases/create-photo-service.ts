import { IPhotoService } from "@/entities/models/photo-service.interface";
import { IPhotoServiceRepository } from "@/repository/photo-service.repository.interface";

export class CreatePhotoServiceUseCase {
  constructor(private readonly photoServiceRepository: IPhotoServiceRepository) {}

  async handle(photoService: IPhotoService): Promise<IPhotoService> {
    return this.photoServiceRepository.create(photoService);
  }
}
