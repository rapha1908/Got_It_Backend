import { PrismaStaffRepository } from "@/repository/prisma/staff.repository";
import { CreateStaffUseCase } from "@/use-cases/create-staff";

export function makeCreateStaffUseCase() {
  const staffRepository = new PrismaStaffRepository();
  const createStaffUseCase = new CreateStaffUseCase(staffRepository);
  return createStaffUseCase;
}
