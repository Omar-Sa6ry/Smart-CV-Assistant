import { IExperienceBuilder } from '../interfaces/iexperience.interface';
import { Experience } from '../models/experience.model';

export class StandardExperienceBuilder implements IExperienceBuilder {
  private experience: Partial<Experience>;

  constructor() {
    this.reset();
  }

  reset(): this {
    this.experience = {};
    return this;
  }

  setJobTitle(jobTitle: string): this {
    this.experience.jobTitle = jobTitle;
    return this;
  }

  setCompanyName(companyName: string): this {
    this.experience.companyName = companyName;
    return this;
  }

  setCompanyWebsite(companyWebsite?: string): this {
    this.experience.companyWebsite = companyWebsite;
    return this;
  }

  setLocation(location?: string): this {
    this.experience.location = location;
    return this;
  }

  setStartDate(startDate: Date): this {
    this.experience.startDate = startDate;
    return this;
  }

  setEndDate(endDate?: Date): this {
    this.experience.endDate = endDate;
    return this;
  }

  setIsCurrentJob(isCurrentJob: boolean): this {
    this.experience.isCurrentJob = isCurrentJob;
    return this;
  }

  setDescription(description: string): this {
    this.experience.description = description;
    return this;
  }

  setAchievements(achievements?: string): this {
    this.experience.achievements = achievements;
    return this;
  }

  setEmploymentType(employmentType: any): this {
    this.experience.employmentType = employmentType;
    return this;
  }

  setUser(userId: string): this {
    (this.experience as any).userId = userId;
    return this;
  }

  setCv(cvId: string): this {
    (this.experience as any).cvId = cvId;
    return this;
  }

  build(): Partial<Experience> {
    const result = { ...this.experience };
    this.reset();
    return result;
  }
}
