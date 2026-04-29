import { Award } from "../models/award.model";

export interface IAwardBuilder {
  reset(): this;
  setTitle(title: string): this;
  setIssuer(issuer: string): this;
  setIssueDate(date: Date): this;
  setDescription(description?: string): this;
  setUser(userId: string): this;
  setCv(cvId: string): this;
  build(): Partial<Award>;
}
