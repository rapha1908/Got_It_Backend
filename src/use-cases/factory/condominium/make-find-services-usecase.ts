import { PrismaServiceRepository } from "@/repository/prisma/service.repository";
import { FindServicesByCondominiumUseCase } from "@/use-cases/find-services-by-condominium";

export function makeFindServicesByCondominiumUseCase() {
  const serviceRepository = new PrismaServiceRepository();
  const findServicesByCondominiumUseCase = new FindServicesByCondominiumUseCase(serviceRepository);
  return findServicesByCondominiumUseCase;
}
