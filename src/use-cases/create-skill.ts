import { ISkill } from "@/entities/models/skill.interface";
import { IStaffSkillRepository } from "@/repository/staff-skill.repository.interface";

export class CreateSkillUseCase {
  constructor(private readonly staffSkillRepository: IStaffSkillRepository) {}

  async handle(skill: ISkill): Promise<ISkill> {
    return this.staffSkillRepository.createSkill(skill);
  }
}
