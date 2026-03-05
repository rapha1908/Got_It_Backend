import { StaffRepository } from "@/repository/pg/staff.repository";
import { CreateStaffUseCase } from "@/use-cases/create-staff";

export function makeCreateStaffUseCase() {
  const staffRepository = new StaffRepository();
  const createStaffUseCase = new CreateStaffUseCase(staffRepository);
  return createStaffUseCase;
}
