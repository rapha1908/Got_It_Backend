import { ManagerEntity } from "@/entities/manager.entity";
import { UserEntity } from "@/entities/user.entity";

export interface IUserRepository {
  create(user: UserEntity): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByUserId(user_id: number): Promise<(UserEntity & ManagerEntity) | undefined>;
}
