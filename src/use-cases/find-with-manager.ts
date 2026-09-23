import { IManager } from "@/entities/models/manager.interface";
import { ResourceNotFoundError } from "./errors/resource-not-found-erro";
import { IManagerRepository } from "@/repository/manager.repository.interface";

export class FindWithManagerUseCase {
  constructor(private readonly managerRepository: IManagerRepository) {}

  async handle(user_id: number): Promise<IManager> {
    const manager = await this.managerRepository.findWithManager(user_id);
    if (!manager) {
      throw new ResourceNotFoundError();
    }
    return manager;
  }
}
