import { ICertificationBuilder } from "../interfaces/icertification.interface";
import { Certification } from "../models/certification.model";

export class StandardCertificationBuilder implements ICertificationBuilder {
  private certification: Partial<Certification>;

  constructor() {
    this.reset();
  }

  reset(): this {
    this.certification = {};
    return this;
  }

  setName(name: string): this {
    this.certification.name = name;
    return this;
  }

  setIssuingOrganization(org: string): this {
    this.certification.issuingOrganization = org;
    return this;
  }

  setCredentialId(id?: string): this {
    this.certification.credentialId = id;
    return this;
  }

  setCredentialUrl(url: string): this {
    this.certification.credentialUrl = url;
    return this;
  }

  setIssueDate(date: Date): this {
    this.certification.issueDate = date;
    return this;
  }

  setUser(userId: string): this {
    (this.certification as any).userId = userId;
    return this;
  }

  setCv(cvId: string): this {
    (this.certification as any).cvId = cvId;
    return this;
  }

  build(): Partial<Certification> {
    const result = { ...this.certification };
    this.reset();
    return result;
  }
}
