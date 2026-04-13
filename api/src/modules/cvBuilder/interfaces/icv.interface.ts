import { Cv } from "../models/cv.model";

export interface ICvBuilder {
  reset(): this;
  setTitle(title: string): this;
  setUser(userId: string): this;
  setIsDefault(isDefault: boolean): this;

  addSkill?(skillId: string): this;
  addExperience?(experienceId: string): this;
  addEducation?(educationId: string): this;
  build(): Partial<Cv>;
}
