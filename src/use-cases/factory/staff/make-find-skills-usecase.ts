import { PrismaStaffSkillRepository } from "@/repository/prisma/staff-skill.repository";
import { FindStaffSkillsUseCase } from "@/use-cases/find-staff-skills";

export function makeFindStaffSkillsUseCase() {
  const staffSkillRepository = new PrismaStaffSkillRepository();
  const findStaffSkillsUseCase = new FindStaffSkillsUseCase(staffSkillRepository);
  return findStaffSkillsUseCase;
}
