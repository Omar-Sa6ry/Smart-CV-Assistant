import { ILanguageBuilder } from "../interfaces/ilanguage.interface";
import { Language } from "../models/language.model";
import { Proficiency } from "@prisma/client";

export class StandardLanguageBuilder implements ILanguageBuilder {
  private language: Partial<Language>;

  constructor() {
    this.reset();
  }

  reset(): this {
    this.language = {};
    return this;
  }

  setName(name: string): this {
    this.language.name = name;
    return this;
  }

  setProficiency(proficiency: Proficiency): this {
    this.language.proficiency = proficiency;
    return this;
  }

  setUser(userId: string): this {
    (this.language as any).userId = userId;
    return this;
  }

  setCv(cvId: string): this {
    (this.language as any).cvId = cvId;
    return this;
  }

  build(): Partial<Language> {
    const result = { ...this.language };
    this.reset();
    return result;
  }
}
