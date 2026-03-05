import { StaffSkillRepository } from "@/repository/pg/staff-skill.repository";
import { CreateSkillUseCase } from "@/use-cases/create-skill";

export function makeCreateSkillUseCase() {
  const staffSkillRepository = new StaffSkillRepository();
  const createSkillUseCase = new CreateSkillUseCase(staffSkillRepository);
  return createSkillUseCase;
}
