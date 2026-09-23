import { ICheckList, ICheckListWithItems } from "@/entities/models/check-list.interface";

export interface ICheckListRepository {
  create(checkList: ICheckList): Promise<ICheckList>;
  findByServiceId(service_id: string): Promise<ICheckListWithItems[]>;
}
