import { UserEntity } from "@/entities/user.entity";
import { UserRepository } from "@/repository/user.repository";
import { ManagerEntity } from "@/entities/manager.entity";
import { ResourceNotFoundError } from "./errors/resource-not-found-erro";

export class FindWithManagerUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async handle(user_id: number): Promise<(UserEntity & ManagerEntity) | undefined> {
    const user = await this.userRepository.findByUserId(user_id);
    if (!user) {
      throw new ResourceNotFoundError();
    }
    return user;
  }
}
