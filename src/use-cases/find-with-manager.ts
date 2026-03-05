import { UserEntity } from "@/entities/user.entity";
import { IUserRepository } from "@/repository/user.repository.interface";
import { IManager } from "@/entities/models/manager.interface";
import { ResourceNotFoundError } from "./errors/resource-not-found-erro";

export class FindWithManagerUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(user_id: number): Promise<(UserEntity & IManager) | undefined> {
    const user = await this.userRepository.findByUserId(user_id);
    if (!user) {
      throw new ResourceNotFoundError();
    }
    return user;
  }
}
