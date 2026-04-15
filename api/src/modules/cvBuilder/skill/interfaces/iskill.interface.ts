import { Skill } from "../models/skill.model";
import { SkillProficiency } from "@prisma/client";

export interface ISkillBuilder {
  reset(): this;
  setName(name: string): this;
  setProficiency(proficiency: SkillProficiency): this;
  setYearsOfExperience(years?: number): this;
  setUser(userId: string): this;
  setCv(cvId: string): this;
  setKeyword(keywordId: string | null): this;
  build(): Partial<Skill>;
}
