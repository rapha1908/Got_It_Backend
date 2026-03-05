import { ISkill } from "@/entities/models/skill.interface";
import { IStaffSkill } from "@/entities/models/staff-skill.interface";

export interface IStaffSkillRepository {
  createSkill(skill: ISkill): Promise<ISkill>;
  addSkillToStaff(staffSkill: IStaffSkill): Promise<IStaffSkill>;
  findSkillsByStaffId(staff_id: number): Promise<ISkill[]>;
}
