import { PrismaStaffRepository } from "@/repository/prisma/staff.repository";
import { FindWithStaffUseCase } from "@/use-cases/find-with-staff";

export function makeFindStaffUseCase() {
  const staffRepository = new PrismaStaffRepository();
  const findWithStaff = new FindWithStaffUseCase(staffRepository);
  return findWithStaff;
}
