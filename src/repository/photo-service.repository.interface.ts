import { IPhotoService } from "@/entities/models/photo-service.interface";

export interface IPhotoServiceRepository {
  create(photoService: IPhotoService): Promise<IPhotoService>;
  findByServiceIds(service_ids: string[]): Promise<IPhotoService[]>;
}
