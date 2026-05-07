import { IAwardBuilder } from "../interfaces/iaward.interface";
import { Award } from "../models/award.model";

export class StandardAwardBuilder implements IAwardBuilder {
  private award: Partial<Award>;

  constructor() {
    this.reset();
  }

  reset(): this {
    this.award = {};
    return this;
  }

  setTitle(title: string): this {
    this.award.title = title;
    return this;
  }

  setIssuer(issuer: string): this {
    this.award.issuer = issuer;
    return this;
  }

  setIssueDate(date: Date): this {
    this.award.issueDate = date;
    return this;
  }

  setDescription(description?: string): this {
    this.award.description = description;
    return this;
  }

  setUser(userId: string): this {
    (this.award as any).userId = userId;
    return this;
  }

  setCv(cvId: string): this {
    (this.award as any).cvId = cvId;
    return this;
  }

  build(): Partial<Award> {
    const result = { ...this.award };
    this.reset();
    return result;
  }
}
