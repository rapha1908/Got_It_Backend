import { IService } from "@/entities/models/service.interface";

export interface IServiceRepository {
  create(service: IService): Promise<IService>;
  findById(id: string): Promise<IService | null>;
  findByCondominiumIds(condominium_ids: number[]): Promise<IService[]>;
  findByStaffIds(staff_ids: number[]): Promise<IService[]>;
}
