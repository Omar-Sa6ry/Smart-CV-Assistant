import { LanguageFactory } from './language.factory';
import { Proficiency } from '@prisma/client';
import { Language } from '../models/language.model';

describe('LanguageFactory', () => {
  const mockPrismaLanguage = {
    id: 'lang-1',
    name: 'English',
    proficiency: Proficiency.fluent,
    userId: 'user-1',
    cvId: 'cv-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('fromPrisma', () => {
    it('should transform prisma language to language model', () => {
      const result = LanguageFactory.fromPrisma(mockPrismaLanguage as any);

      expect(result).toBeInstanceOf(Language);
      expect(result.id).toBe(mockPrismaLanguage.id);
      expect(result.name).toBe(mockPrismaLanguage.name);
      expect(result.proficiency).toBe(mockPrismaLanguage.proficiency);
    });

    it('should handle relations if present', () => {
      const languageWithRelations = {
        ...mockPrismaLanguage,
        user: { id: 'user-1', firstName: 'Omar' },
        cv: { id: 'cv-1', title: 'My CV' },
      };

      const result = LanguageFactory.fromPrisma(languageWithRelations as any);

      expect(result.id).toBe(mockPrismaLanguage.id);
      // plainToInstance with excludeExtraneousValues: false should keep relations if they match the model
    });
  });

  describe('fromPrismaArray', () => {
    it('should transform an array of prisma languages', () => {
      const languages = [mockPrismaLanguage, { ...mockPrismaLanguage, id: 'lang-2' }];
      const result = LanguageFactory.fromPrismaArray(languages as any);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Language);
      expect(result[1]).toBeInstanceOf(Language);
      expect(result[1].id).toBe('lang-2');
    });
  });
});
