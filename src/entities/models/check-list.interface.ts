import { ICheckListItem } from "./check-list-item.interface";

export interface ICheckList {
  id?: number;
  service_id: string;
  description: string;
  created_at?: Date;
}

export interface ICheckListWithItems extends ICheckList {
  items: ICheckListItem[];
}
