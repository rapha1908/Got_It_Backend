import { ManagerRepository } from "@/repository/manager.respository";
import { ManagerEntity } from "@/entities/manager.entity";

export class CreateManagerUseCase {
  constructor(private readonly managerRepository: ManagerRepository) {}

  async handle(manager: ManagerEntity): Promise<ManagerEntity> {
    return this.managerRepository.create(manager);
  }
}
