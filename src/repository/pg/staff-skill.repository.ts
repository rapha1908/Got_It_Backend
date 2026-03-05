import { SkillEntity } from "@/entities/skill.entity";
import { StaffSkillEntity } from "@/entities/staff-skill.entity";
import { db } from "@/lib/pg/db";
import { IStaffSkillRepository } from "../staff-skill.repository.interface";

export class StaffSkillRepository implements IStaffSkillRepository {
  async createSkill(skill: SkillEntity): Promise<SkillEntity> {
    const client = await db.clientInstance;
    const result = await client.query("INSERT INTO skills (name) VALUES ($1) RETURNING *", [skill.name]);
    return result.rows[0];
  }

  async addSkillToStaff(staffSkill: StaffSkillEntity): Promise<StaffSkillEntity> {
    const client = await db.clientInstance;
    const result = await client.query(
      "INSERT INTO staff_skills (staff_id, skill_id) VALUES ($1, $2) RETURNING *",
      [staffSkill.staff_id, staffSkill.skill_id],
    );
    return result.rows[0];
  }

  async findSkillsByStaffId(staff_id: number): Promise<SkillEntity[]> {
    const client = await db.clientInstance;
    const result = await client.query(
      "SELECT skills.* FROM skills JOIN staff_skills ON skills.id = staff_skills.skill_id WHERE staff_skills.staff_id = $1",
      [staff_id],
    );
    return result.rows;
  }
}
