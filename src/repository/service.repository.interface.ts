import { IService } from "@/entities/models/service.interface";

export interface IServiceRepository {
  create(service: IService): Promise<IService>;
  findByCondominiumId(condominium_id: number): Promise<IService[]>;
}
