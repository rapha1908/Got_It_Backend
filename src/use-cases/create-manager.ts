import { IManager } from "@/entities/models/manager.interface";
import { IManagerRepository } from "@/repository/manager.repository.interface";

export class CreateManagerUseCase {
  constructor(private readonly managerRepository: IManagerRepository) {}

  async handle(manager: IManager): Promise<IManager> {
    return this.managerRepository.create(manager);
  }
}
