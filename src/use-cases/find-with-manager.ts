import { UserEntity } from "@/entities/user.entity";
import { IManager } from "@/entities/models/manager.interface";
import { ResourceNotFoundError } from "./errors/resource-not-found-erro";
import { IManagerRepository } from "@/repository/manager.repository.interface";

export class FindWithManagerUseCase {
  constructor(private readonly managerRepository: IManagerRepository) {}

  async handle(user_id: number): Promise<(UserEntity & IManager) | undefined> {
    const user = await this.managerRepository.findWithManager(user_id);
    if (!user) {
      throw new ResourceNotFoundError();
    }
    return user;
  }
}
