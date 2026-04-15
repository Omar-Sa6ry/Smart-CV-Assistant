import { ICvBuilder } from '../interfaces/icv.interface';
import { Cv } from '../models/cv.model';

export class StandardCvBuilder implements ICvBuilder {
  private cv: Partial<Cv>;

  constructor() {
    this.reset();
  }

  reset(): this {
    this.cv = {};
    return this;
  }

  setTitle(title: string): this {
    this.cv.title = title;
    return this;
  }

  setSummary(summary: string): this {
    this.cv.summary = summary;
    return this;
  }

  setUser(userId: string): this {
    (this.cv as any).userId = userId;
    return this;
  }

  setIsDefault(isDefault: boolean): this {
    this.cv.isDefault = isDefault;
    return this;
  }

  setIsPhone(phone: string): this {
    this.cv.phone = phone;
    return this;
  }

  setGithub(github?: string): this {
    if (github) {
      this.cv.github = github;
    }
    return this;
  }

  setPortfolio(portfolio?: string): this {
    if (portfolio) {
      this.cv.portfolio = portfolio;
    }
    return this;
  }

  setLinkedin(linkedin?: string): this {
    if (linkedin) {
      this.cv.linkedin = linkedin;
    }
    return this;
  }

  setPhone(phone?: string): this {
    if (phone) {
      this.cv.phone = phone;
    }
    return this;
  }

  setLocation(location?: string): this {
    if (location) {
      this.cv.location = location;
    }
    return this;
  }

  build(): Partial<Cv> {
    const result = { ...this.cv };
    this.reset();
    return result;
  }
}
