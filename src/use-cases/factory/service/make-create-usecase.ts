import { ServiceRepository } from "@/repository/pg/service.repository";
import { CreateServiceUseCase } from "@/use-cases/create-service";

export function makeCreateServiceUseCase() {
  const serviceRepository = new ServiceRepository();
  const createServiceUseCase = new CreateServiceUseCase(serviceRepository);
  return createServiceUseCase;
}
