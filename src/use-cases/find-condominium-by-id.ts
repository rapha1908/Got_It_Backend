import { ICondominium } from "@/entities/models/condominium.interface";
import { ICondominiumRepository } from "@/repository/condominium.repository.interface";
import { ResourceNotFoundError } from "./errors/resource-not-found-erro";

export class FindCondominiumByIdUseCase {
  constructor(private readonly condominiumRepository: ICondominiumRepository) {}

  async handle(id: number): Promise<ICondominium> {
    const condominium = await this.condominiumRepository.findById(id);

    if (!condominium) {
      throw new ResourceNotFoundError();
    }

    return condominium;
  }
}
