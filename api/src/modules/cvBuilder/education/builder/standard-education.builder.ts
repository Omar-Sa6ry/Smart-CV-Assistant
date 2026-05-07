import { Degree } from '@prisma/client';
import { IEducationBuilder } from '../interfaces/ieducation.interface';
import { Education } from '../models/education.model';

export class StandardEducationBuilder implements IEducationBuilder {
  private education: Partial<Education>;

  constructor() {
    this.reset();
  }

  reset(): this {
    this.education = {};
    return this;
  }

  setInstitution(institution: string): this {
    this.education.institution = institution;
    return this;
  }

  setTitle(title: string): this {
    this.education.title = title;
    return this;
  }

  setLocation(location?: string): this {
    this.education.location = location;
    return this;
  }

  setDescription(description?: string): this {
    this.education.description = description;
    return this;
  }

  setDegree(degree: Degree): this {
    this.education.degree = degree;
    return this;
  }

  setGpa(gpa?: number): this {
    this.education.gpa = gpa;
    return this;
  }

  setIsCurrent(isCurrent: boolean): this {
    this.education.isCurrent = isCurrent;
    return this;
  }

  setStartDate(date: Date): this {
    this.education.startDate = date;
    return this;
  }

  setEndDate(date?: Date): this {
    this.education.endDate = date;
    return this;
  }

  setUser(userId: string): this {
    (this.education as any).userId = userId;
    return this;
  }

  setCv(cvId: string): this {
    (this.education as any).cvId = cvId;
    return this;
  }

  build(): Partial<Education> {
    const result = { ...this.education };
    this.reset();
    return result;
  }
}
