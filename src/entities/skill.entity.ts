import { ISkill } from "./models/skill.interface";

export class SkillEntity implements ISkill {
  id?: number;
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}
