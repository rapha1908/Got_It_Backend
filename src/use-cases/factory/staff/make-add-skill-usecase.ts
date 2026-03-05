import { StaffSkillRepository } from "@/repository/pg/staff-skill.repository";
import { AddSkillToStaffUseCase } from "@/use-cases/add-skill-to-staff";

export function makeAddSkillToStaffUseCase() {
  const staffSkillRepository = new StaffSkillRepository();
  const addSkillToStaffUseCase = new AddSkillToStaffUseCase(staffSkillRepository);
  return addSkillToStaffUseCase;
}
