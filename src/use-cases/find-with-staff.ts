import { StaffEntity } from "@/entities/staff.entity";
import { UserEntity } from "@/entities/user.entity";
import { IStaffRepository } from "@/repository/staff.repository.interface";
import { ResourceNotFoundError } from "./errors/resource-not-found-erro";

export class FindWithStaffUseCase {
  constructor(private readonly staffRepository: IStaffRepository) {}

  async handle(user_id: number): Promise<(UserEntity & StaffEntity) | undefined> {
    const user = await this.staffRepository.findWithStaff(user_id);

    if (!user) {
      throw new ResourceNotFoundError();
    }

    return user;
  }
}
