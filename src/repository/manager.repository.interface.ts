import { IManager } from "@/entities/models/manager.interface";
import { UserEntity } from "@/entities/user.entity";

export interface IManagerRepository {
  create(manager: IManager): Promise<IManager>;
  findWithManager(user_id: number): Promise<(UserEntity & IManager) | undefined>;
}
