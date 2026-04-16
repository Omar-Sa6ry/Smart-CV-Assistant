import { IProjectBuilder } from '../interfaces/iproject.interface';
import { Project } from '../models/project.model';

export class StandardProjectBuilder implements IProjectBuilder {
  private project: Partial<Project>;

  constructor() {
    this.reset();
  }

  reset(): this {
    this.project = {};
    return this;
  }

  setName(name: string): this {
    this.project.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.project.description = description;
    return this;
  }

  setProjectUrl(url: string): this {
    this.project.projectUrl = url;
    return this;
  }

  setStartDate(date?: Date): this {
    this.project.startDate = date;
    return this;
  }

  setEndDate(date?: Date): this {
    this.project.endDate = date;
    return this;
  }

  setUser(userId: string): this {
    (this.project as any).userId = userId;
    return this;
  }

  setCv(cvId: string): this {
    (this.project as any).cvId = cvId;
    return this;
  }

  build(): Partial<Project> {
    const result = { ...this.project };
    this.reset();
    return result;
  }
}
