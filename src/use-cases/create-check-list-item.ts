import { ICheckListItem } from "@/entities/models/check-list-item.interface";
import { ICheckListItemRepository } from "@/repository/check-list-item.repository.interface";

export class CreateCheckListItemUseCase {
  constructor(private readonly checkListItemRepository: ICheckListItemRepository) {}

  async handle(checkListItem: ICheckListItem): Promise<ICheckListItem> {
    return this.checkListItemRepository.create(checkListItem);
  }
}
