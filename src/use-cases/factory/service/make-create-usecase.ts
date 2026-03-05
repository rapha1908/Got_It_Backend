import { PrismaServiceRepository } from "@/repository/prisma/service.repository";
import { CreateServiceUseCase } from "@/use-cases/create-service";

export function makeCreateServiceUseCase() {
  const serviceRepository = new PrismaServiceRepository();
  const createServiceUseCase = new CreateServiceUseCase(serviceRepository);
  return createServiceUseCase;
}
