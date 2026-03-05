import { IPhotoService } from "./models/photo-service.interface";

export class PhotoServiceEntity implements IPhotoService {
  id?: number;
  service_id: string;
  photo_url: string;
  created_at?: Date;
  updated_at?: Date;

  constructor(service_id: string, photo_url: string) {
    this.service_id = service_id;
    this.photo_url = photo_url;
  }
}
