import { ICheckListItem } from "./check-list-item.interface";

export interface ICheckList {
  id?: number;
  service_id: string;
  description: string;
}

export interface ICheckListWithItems extends ICheckList {
  items: ICheckListItem[];
}
