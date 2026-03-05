import { IManager } from "@/entities/models/manager.interface";
import { UserEntity } from "@/entities/user.entity";

export interface IUserRepository {
  create(user: UserEntity): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByUserId(user_id: number): Promise<(UserEntity & IManager) | undefined>;
}
