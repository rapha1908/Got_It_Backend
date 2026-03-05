import { SkillEntity } from "@/entities/skill.entity";
import { StaffSkillEntity } from "@/entities/staff-skill.entity";

export interface IStaffSkillRepository {
  createSkill(skill: SkillEntity): Promise<SkillEntity>;
  addSkillToStaff(staffSkill: StaffSkillEntity): Promise<StaffSkillEntity>;
  findSkillsByStaffId(staff_id: number): Promise<SkillEntity[]>;
}
