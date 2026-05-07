import { Experience } from "../models/experience.model";

export interface IExperienceBuilder {
  reset(): this;
  setJobTitle(jobTitle: string): this;
  setCompanyName(companyName: string): this;
  setCompanyWebsite(companyWebsite: string): this;
  setLocation(location: string): this;
  setStartDate(startDate: Date): this;
  setEndDate(endDate?: Date): this;
  setIsCurrentJob(isCurrentJob: boolean): this;
  setDescription(description: string): this;
  setEmploymentType(employmentType: string): this;
  setUser(userId: string): this;
  setCv(cvId: string): this;
  build(): Partial<Experience>;
}
