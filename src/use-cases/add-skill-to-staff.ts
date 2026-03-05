import { StaffSkillEntity } from "@/entities/staff-skill.entity";
import { IStaffSkillRepository } from "@/repository/staff-skill.repository.interface";

export class AddSkillToStaffUseCase {
  constructor(private readonly staffSkillRepository: IStaffSkillRepository) {}

  async handle(staffSkill: StaffSkillEntity): Promise<StaffSkillEntity> {
    return this.staffSkillRepository.addSkillToStaff(staffSkill);
  }
}
