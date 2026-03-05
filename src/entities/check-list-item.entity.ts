import { ICheckListItem } from "./models/check-list-item.interface";

export class CheckListItemEntity implements ICheckListItem {
  id?: number;
  check_list_id: number;
  description: string;
  completed: boolean;

  constructor(check_list_id: number, description: string, completed: boolean) {
    this.check_list_id = check_list_id;
    this.description = description;
    this.completed = completed;
  }
}
