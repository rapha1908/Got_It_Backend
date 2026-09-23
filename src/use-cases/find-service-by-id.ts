import { IService } from "@/entities/models/service.interface";
import { IServiceRepository } from "@/repository/service.repository.interface";
import { ResourceNotFoundError } from "./errors/resource-not-found-erro";

export class FindServiceByIdUseCase {
  constructor(private readonly serviceRepository: IServiceRepository) {}

  async handle(id: string): Promise<IService> {
    const service = await this.serviceRepository.findById(id);

    if (!service) {
      throw new ResourceNotFoundError();
    }

    return service;
  }
}
