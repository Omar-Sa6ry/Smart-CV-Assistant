import { Project } from "../models/project.model";

export interface IProjectBuilder {
  reset(): this;
  setName(name: string): this;
  setDescription(description?: string): this;
  setTechnologiesUsed(technologies?: string): this;
  setProjectUrl(url?: string): this;
  setIsPersonalProject(isPersonal: boolean): this;
  setStartDate(date?: Date): this;
  setEndDate(date?: Date): this;
  setIsTeamProject(isTeam: boolean): this;
  setTeamSize(size: number): this;
  setUser(userId: string): this;
  setCv(cvId: string): this;
  build(): Partial<Project>;
}
