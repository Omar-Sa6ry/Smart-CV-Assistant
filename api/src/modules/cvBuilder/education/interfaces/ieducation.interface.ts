import { Education } from "../models/education.model";
import { Degree } from "@prisma/client";

export interface IEducationBuilder {
  reset(): this;
  setInstitution(institution: string): this;
  setTitle(title: string): this;
  setLocation(location?: string): this;
  setDescription(description?: string): this;
  setDegree(degree: Degree): this;
  setGpa(gpa?: number): this;
  setIsCurrent(isCurrent: boolean): this;
  setStartDate(date: Date): this;
  setEndDate(date?: Date): this;
  setUser(userId: string): this;
  setCv(cvId: string): this;
  build(): Partial<Education>;
}
