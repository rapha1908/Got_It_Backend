export class StaffSkillEntity {
  id?: number;
  staff_id: number;
  skill_id: number;

  constructor(staff_id: number, skill_id: number) {
    this.staff_id = staff_id;
    this.skill_id = skill_id;
  }
}
