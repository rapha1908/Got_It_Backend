import { PrismaStaffSkillRepository } from "@/repository/prisma/staff-skill.repository";
import { AddSkillToStaffUseCase } from "@/use-cases/add-skill-to-staff";

export function makeAddSkillToStaffUseCase() {
  const staffSkillRepository = new PrismaStaffSkillRepository();
  const addSkillToStaffUseCase = new AddSkillToStaffUseCase(staffSkillRepository);
  return addSkillToStaffUseCase;
}
