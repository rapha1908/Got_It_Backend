import { SkillEntity } from "@/entities/skill.entity";
import { IStaffSkillRepository } from "@/repository/staff-skill.repository.interface";

export class CreateSkillUseCase {
  constructor(private readonly staffSkillRepository: IStaffSkillRepository) {}

  async handle(skill: SkillEntity): Promise<SkillEntity> {
    return this.staffSkillRepository.createSkill(skill);
  }
}
