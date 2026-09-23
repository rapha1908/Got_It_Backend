import { ISkill } from "@/entities/models/skill.interface";
import { ISkillOfStaff, IStaffSkill } from "@/entities/models/staff-skill.interface";

export interface IStaffSkillRepository {
  createSkill(skill: ISkill): Promise<ISkill>;
  addSkillToStaff(staffSkill: IStaffSkill): Promise<IStaffSkill>;
  findSkillsByStaffIds(staff_ids: number[]): Promise<ISkillOfStaff[]>;
}
