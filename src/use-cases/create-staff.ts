import { IStaff } from "@/entities/models/staff.interface";
import { IStaffRepository } from "@/repository/staff.repository.interface";

export class CreateStaffUseCase {
  constructor(private readonly staffRepository: IStaffRepository) {}

  async handle(staff: IStaff): Promise<IStaff> {
    return this.staffRepository.create(staff);
  }
}
