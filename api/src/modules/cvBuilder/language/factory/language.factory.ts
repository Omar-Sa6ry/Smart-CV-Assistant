import { Injectable } from '@nestjs/common';
import { Language } from '../models/language.model';
import { Language as PrismaLanguage, User as PrismaUser, Cv as PrismaCv } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

type PrismaLanguageWithRelations = PrismaLanguage & { 
  user?: PrismaUser | null;
  cv?: PrismaCv | null;
};

@Injectable()
export class LanguageFactory {
  static fromPrisma(language: PrismaLanguageWithRelations): Language {
    return plainToInstance(Language, language, {
      excludeExtraneousValues: false,
    });
  }

  static fromPrismaArray(languages: PrismaLanguageWithRelations[]): Language[] {
    return languages.map(lang => this.fromPrisma(lang));
  }
}
