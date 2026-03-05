import { ManagerRepository } from "@/repository/pg/manager.respository";
import { CreateManagerUseCase } from "@/use-cases/create-manager";

export function makeCreateManagerUseCase() {
  const managerRepository = new ManagerRepository();
  const createManagerUseCase = new CreateManagerUseCase(managerRepository);
  return createManagerUseCase;
}
