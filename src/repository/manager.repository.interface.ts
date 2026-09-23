import { IManager } from "@/entities/models/manager.interface";

export interface IManagerRepository {
  create(manager: IManager): Promise<IManager>;
  findWithManager(user_id: number): Promise<IManager | undefined>;
  findByIds(ids: number[]): Promise<IManager[]>;
  findByUserIds(user_ids: number[]): Promise<IManager[]>;
}
