import { PrismaStaffSkillRepository } from "@/repository/prisma/staff-skill.repository";
import { CreateSkillUseCase } from "@/use-cases/create-skill";

export function makeCreateSkillUseCase() {
  const staffSkillRepository = new PrismaStaffSkillRepository();
  const createSkillUseCase = new CreateSkillUseCase(staffSkillRepository);
  return createSkillUseCase;
}
