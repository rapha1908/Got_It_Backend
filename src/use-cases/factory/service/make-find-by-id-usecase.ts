import { PrismaServiceRepository } from "@/repository/prisma/service.repository";
import { FindServiceByIdUseCase } from "@/use-cases/find-service-by-id";

export function makeFindServiceByIdUseCase() {
  const serviceRepository = new PrismaServiceRepository();
  const findServiceByIdUseCase = new FindServiceByIdUseCase(serviceRepository);
  return findServiceByIdUseCase;
}
