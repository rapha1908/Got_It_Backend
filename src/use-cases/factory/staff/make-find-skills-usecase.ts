import { StaffSkillRepository } from "@/repository/pg/staff-skill.repository";
import { FindStaffSkillsUseCase } from "@/use-cases/find-staff-skills";

export function makeFindStaffSkillsUseCase() {
  const staffSkillRepository = new StaffSkillRepository();
  const findStaffSkillsUseCase = new FindStaffSkillsUseCase(staffSkillRepository);
  return findStaffSkillsUseCase;
}
