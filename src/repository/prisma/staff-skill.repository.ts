import { ISkill } from "@/entities/models/skill.interface";
import { ISkillOfStaff, IStaffSkill } from "@/entities/models/staff-skill.interface";
import { prisma } from "@/lib/prisma/db";
import { IStaffSkillRepository } from "../staff-skill.repository.interface";

export class PrismaStaffSkillRepository implements IStaffSkillRepository {
  async createSkill(skill: ISkill): Promise<ISkill> {
    const createdSkill = await prisma.skill.create({
      data: {
        name: skill.name,
      },
    });

    return createdSkill;
  }

  async addSkillToStaff(staffSkill: IStaffSkill): Promise<IStaffSkill> {
    const createdStaffSkill = await prisma.staffSkill.create({
      data: {
        staff_id: staffSkill.staff_id,
        skill_id: staffSkill.skill_id,
      },
    });

    return createdStaffSkill;
  }

  async findSkillsByStaffId(staff_id: number): Promise<ISkill[]> {
    const relations = await prisma.staffSkill.findMany({
      where: { staff_id },
      include: { skill: true },
    });

    return relations.map((relation) => relation.skill);
  }

  async findSkillsByStaffIds(staff_ids: number[]): Promise<ISkillOfStaff[]> {
    const relations = await prisma.staffSkill.findMany({
      where: { staff_id: { in: staff_ids } },
      include: { skill: true },
    });

    return relations.map((relation) => ({ ...relation.skill, staff_id: relation.staff_id }));
  }
}
