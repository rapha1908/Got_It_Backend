import { IStaff } from "@/entities/models/staff.interface";
import { UserEntity } from "@/entities/user.entity";

export interface IStaffRepository {
  create(staff: IStaff): Promise<IStaff>;
  findWithStaff(user_id: number): Promise<(UserEntity & IStaff) | undefined>;
}
