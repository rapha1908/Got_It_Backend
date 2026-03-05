import { StaffEntity } from "@/entities/staff.entity";
import { IStaffRepository } from "@/repository/staff.repository.interface";

export class CreateStaffUseCase {
  constructor(private readonly staffRepository: IStaffRepository) {}

  async handle(staff: StaffEntity): Promise<StaffEntity> {
    return this.staffRepository.create(staff);
  }
}
