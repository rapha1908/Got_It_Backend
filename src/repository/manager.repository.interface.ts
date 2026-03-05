import { ManagerEntity } from "@/entities/manager.entity";
import { UserEntity } from "@/entities/user.entity";

export interface IManagerRepository {
  create(manager: ManagerEntity): Promise<ManagerEntity>;
  findWithManager(user_id: string): Promise<(UserEntity & ManagerEntity) | undefined>;
}
