import { ISkill } from "./skill.interface";

export interface IStaffSkill {
  id?: number;
  staff_id: number;
  skill_id: number;
}

export interface ISkillOfStaff extends ISkill {
  staff_id: number;
}
