import { ICondominium } from "@/entities/models/condominium.interface";
import { ICondominiumRepository } from "@/repository/condominium.repository.interface";

export class FindCondominiumsUseCase {
  constructor(private readonly condominiumRepository: ICondominiumRepository) {}

  async handle(): Promise<ICondominium[]> {
    return this.condominiumRepository.findAll();
  }
}
