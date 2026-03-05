import { ICondominium } from "@/entities/models/condominium.interface";
import { ICondominiumRepository } from "@/repository/condominium.repository.interface";

export class CreateCondominiumUseCase {
  constructor(private readonly condominiumRepository: ICondominiumRepository) {}

  async handle(condominium: ICondominium): Promise<ICondominium> {
    return this.condominiumRepository.create(condominium);
  }
}
