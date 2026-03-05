import { PrismaManagerRepository } from "@/repository/prisma/manager.repository";
import { CreateManagerUseCase } from "@/use-cases/create-manager";

export function makeCreateManagerUseCase() {
  const managerRepository = new PrismaManagerRepository();
  const createManagerUseCase = new CreateManagerUseCase(managerRepository);
  return createManagerUseCase;
}
