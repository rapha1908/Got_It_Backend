import { SkillEntity } from "@/entities/skill.entity";
import { IStaffSkillRepository } from "@/repository/staff-skill.repository.interface";
import { ResourceNotFoundError } from "./errors/resource-not-found-erro";

export class FindStaffSkillsUseCase {
  constructor(private readonly staffSkillRepository: IStaffSkillRepository) {}

  async handle(staff_id: number): Promise<SkillEntity[]> {
    const skills = await this.staffSkillRepository.findSkillsByStaffId(staff_id);

    if (!skills.length) {
      throw new ResourceNotFoundError();
    }

    return skills;
  }
}
