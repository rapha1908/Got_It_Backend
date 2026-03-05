import { IStaffSkill } from "@/entities/models/staff-skill.interface";
import { IStaffSkillRepository } from "@/repository/staff-skill.repository.interface";

export class AddSkillToStaffUseCase {
  constructor(private readonly staffSkillRepository: IStaffSkillRepository) {}

  async handle(staffSkill: IStaffSkill): Promise<IStaffSkill> {
    return this.staffSkillRepository.addSkillToStaff(staffSkill);
  }
}
