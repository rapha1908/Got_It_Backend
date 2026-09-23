import { PrismaStaffRepository } from "@/repository/prisma/staff.repository";
import { FindStaffByIdUseCase } from "@/use-cases/find-staff-by-id";

export function makeFindStaffByIdUseCase() {
  const staffRepository = new PrismaStaffRepository();
  const findStaffByIdUseCase = new FindStaffByIdUseCase(staffRepository);
  return findStaffByIdUseCase;
}
