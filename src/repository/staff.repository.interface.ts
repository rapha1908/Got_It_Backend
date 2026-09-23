import { IStaff } from "@/entities/models/staff.interface";

export interface IStaffRepository {
  create(staff: IStaff): Promise<IStaff>;
  findWithStaff(user_id: number): Promise<IStaff | undefined>;
  findById(id: number): Promise<IStaff | null>;
  findByIds(ids: number[]): Promise<IStaff[]>;
  findByUserIds(user_ids: number[]): Promise<IStaff[]>;
}
