import { IStaff } from "@/entities/models/staff.interface";
import { IStaffRepository } from "@/repository/staff.repository.interface";
import { ResourceNotFoundError } from "./errors/resource-not-found-erro";

export class FindStaffByIdUseCase {
  constructor(private readonly staffRepository: IStaffRepository) {}

  async handle(id: number): Promise<IStaff> {
    const staff = await this.staffRepository.findById(id);

    if (!staff) {
      throw new ResourceNotFoundError();
    }

    return staff;
  }
}
