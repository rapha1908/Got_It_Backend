import { IPhotoService } from "@/entities/models/photo-service.interface";
import { IPhotoServiceRepository } from "@/repository/photo-service.repository.interface";

export class FindPhotosByServiceUseCase {
  constructor(private readonly photoServiceRepository: IPhotoServiceRepository) {}

  async handle(service_id: string): Promise<IPhotoService[]> {
    return this.photoServiceRepository.findByServiceId(service_id);
  }
}
