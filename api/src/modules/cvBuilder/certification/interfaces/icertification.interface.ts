import { Certification } from "../models/certification.model";

export interface ICertificationBuilder {
  reset(): this;
  setName(name: string): this;
  setIssuingOrganization(org: string): this;
  setCredentialId(id?: string): this;
  setCredentialUrl(url: string): this;
  setIssueDate(date: Date): this;
  setUser(userId: string): this;
  setCv(cvId: string): this;
  build(): Partial<Certification>;
}
