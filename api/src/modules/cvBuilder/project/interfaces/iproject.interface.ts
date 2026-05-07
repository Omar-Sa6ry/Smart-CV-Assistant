import { Project } from "../models/project.model";

export interface IProjectBuilder {
  reset(): this;
  setName(name: string): this;
  setDescription(description: string): this;
  setProjectUrl(url: string): this;
  setStartDate(date?: Date): this;
  setEndDate(date?: Date): this;
  setUser(userId: string): this;
  setCv(cvId: string): this;
  build(): Partial<Project>;
}
