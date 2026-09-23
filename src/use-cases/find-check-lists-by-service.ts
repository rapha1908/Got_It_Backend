import { ICheckListWithItems } from "@/entities/models/check-list.interface";
import { ICheckListRepository } from "@/repository/check-list.repository.interface";

export class FindCheckListsByServiceUseCase {
  constructor(private readonly checkListRepository: ICheckListRepository) {}

  async handle(service_id: string): Promise<ICheckListWithItems[]> {
    return this.checkListRepository.findByServiceId(service_id);
  }
}
