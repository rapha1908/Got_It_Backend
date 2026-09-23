import { UserEntity } from "@/entities/user.entity";

export interface IUserRepository {
  create(user: UserEntity): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: number): Promise<UserEntity | null>;
  findByIds(ids: number[]): Promise<UserEntity[]>;
}
