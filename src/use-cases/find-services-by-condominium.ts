import { IService } from "@/entities/models/service.interface";
import { IServiceRepository } from "@/repository/service.repository.interface";

export class FindServicesByCondominiumUseCase {
  constructor(private readonly serviceRepository: IServiceRepository) {}

  async handle(condominium_id: number): Promise<IService[]> {
    return this.serviceRepository.findByCondominiumId(condominium_id);
  }
}
