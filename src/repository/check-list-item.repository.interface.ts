import { ICheckListItem } from "@/entities/models/check-list-item.interface";

export interface ICheckListItemRepository {
  create(checkListItem: ICheckListItem): Promise<ICheckListItem>;
}
