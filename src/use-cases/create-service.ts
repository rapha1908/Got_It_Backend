import { IService } from "@/entities/models/service.interface";
import { IServiceRepository } from "@/repository/service.repository.interface";

export class CreateServiceUseCase {
  constructor(private readonly serviceRepository: IServiceRepository) {}

  async handle(service: IService): Promise<IService> {
    return this.serviceRepository.create(service);
  }
}
