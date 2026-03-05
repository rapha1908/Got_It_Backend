import { PrismaManagerRepository } from "@/repository/prisma/manager.repository";
import { FindWithManagerUseCase } from "@/use-cases/find-with-manager";

export function makeFindManagerUseCase() {
  const managerRepository = new PrismaManagerRepository();
  const findWithManager = new FindWithManagerUseCase(managerRepository);
  return findWithManager;
}
