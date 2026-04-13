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

  build(): Partial<Cv> {
    const result = { ...this.cv };
    this.reset();
    return result;
  }
}
