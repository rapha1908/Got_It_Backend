import { ISkill } from "@/entities/models/skill.interface";
import { IStaffSkillRepository } from "@/repository/staff-skill.repository.interface";
import { ResourceNotFoundError } from "./errors/resource-not-found-erro";

export class FindStaffSkillsUseCase {
  constructor(private readonly staffSkillRepository: IStaffSkillRepository) {}

  async handle(staff_id: number): Promise<ISkill[]> {
    const skills = await this.staffSkillRepository.findSkillsByStaffId(staff_id);

    if (!skills.length) {
      throw new ResourceNotFoundError();
    }

    return skills;
  }
}
