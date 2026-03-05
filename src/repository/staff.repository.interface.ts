import { StaffEntity } from "@/entities/staff.entity";
import { UserEntity } from "@/entities/user.entity";

export interface IStaffRepository {
  create(staff: StaffEntity): Promise<StaffEntity>;
  findWithStaff(user_id: number): Promise<(UserEntity & StaffEntity) | undefined>;
}
