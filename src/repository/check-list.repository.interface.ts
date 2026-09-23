import { ICheckList, ICheckListWithItems } from "@/entities/models/check-list.interface";

export interface ICheckListRepository {
  create(checkList: ICheckList): Promise<ICheckList>;
  findByServiceIds(service_ids: string[]): Promise<ICheckListWithItems[]>;
}
