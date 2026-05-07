import { Language } from "../models/language.model";
import { Proficiency } from "@prisma/client";

export interface ILanguageBuilder {
  reset(): this;
  setName(name: string): this;
  setProficiency(proficiency: Proficiency): this;
  setUser(userId: string): this;
  setCv(cvId: string): this;
  build(): Partial<Language>;
}
