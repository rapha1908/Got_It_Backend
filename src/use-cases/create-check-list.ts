import { ICheckList } from "@/entities/models/check-list.interface";
import { ICheckListRepository } from "@/repository/check-list.repository.interface";

export class CreateCheckListUseCase {
  constructor(private readonly checkListRepository: ICheckListRepository) {}

  async handle(checkList: ICheckList): Promise<ICheckList> {
    return this.checkListRepository.create(checkList);
  }
}
