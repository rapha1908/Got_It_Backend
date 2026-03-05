import { StaffRepository } from "@/repository/pg/staff.repository";
import { FindWithStaffUseCase } from "@/use-cases/find-with-staff";

export function makeFindStaffUseCase() {
  const staffRepository = new StaffRepository();
  const findWithStaff = new FindWithStaffUseCase(staffRepository);
  return findWithStaff;
}
