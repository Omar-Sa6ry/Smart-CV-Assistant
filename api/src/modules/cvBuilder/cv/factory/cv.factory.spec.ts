import { CvFactory } from './cv.factory';
import { Cv } from '../models/cv.model';
import { ExperienceFactory } from '../../experience/factory/experience.factory';
import { EducationFactory } from '../../education/factory/education.factory';
import { ProjectFactory } from '../../project/factory/project.factory';
import { LanguageFactory } from '../../language/factory/language.factory';
import { SkillFactory } from '../../skill/factory/skill.factory';

jest.mock('../../experience/factory/experience.factory');
jest.mock('../../education/factory/education.factory');
jest.mock('../../project/factory/project.factory');
jest.mock('../../language/factory/language.factory');
jest.mock('../../skill/factory/skill.factory');

describe('CvFactory', () => {
  const mockPrismaCv = {
    id: 'cv-1',
    title: 'Software Engineer',
    userId: 'user-1',
    isDefault: true,
    experiences: [{ id: 'exp-1' }],
    educations: [{ id: 'edu-1' }],
    projects: [{ id: 'proj-1' }],
    languages: [{ id: 'lang-1' }],
    skills: [{ id: 'skill-1' }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fromPrisma', () => {
    it('should map Prisma CV and all relations correctly', () => {
      (ExperienceFactory.fromPrismaArray as jest.Mock).mockReturnValue([{ id: 'exp-mapped' }]);
      (EducationFactory.fromPrismaArray as jest.Mock).mockReturnValue([{ id: 'edu-mapped' }]);
      (ProjectFactory.fromPrismaArray as jest.Mock).mockReturnValue([{ id: 'proj-mapped' }]);
      (LanguageFactory.fromPrismaArray as jest.Mock).mockReturnValue([{ id: 'lang-mapped' }]);
      (SkillFactory.fromPrismaArray as jest.Mock).mockReturnValue([{ id: 'skill-mapped' }]);

      const result = CvFactory.fromPrisma(mockPrismaCv as any);

      expect(result).toBeInstanceOf(Cv);
      expect(result.id).toBe('cv-1');
      expect(result.experiences).toEqual([{ id: 'exp-mapped' }]);
      expect(result.educations).toEqual([{ id: 'edu-mapped' }]);
      expect(result.projects).toEqual([{ id: 'proj-mapped' }]);
      expect(result.languages).toEqual([{ id: 'lang-mapped' }]);
      expect(result.skills).toEqual([{ id: 'skill-mapped' }]);

      expect(ExperienceFactory.fromPrismaArray).toHaveBeenCalledWith(mockPrismaCv.experiences);
      expect(EducationFactory.fromPrismaArray).toHaveBeenCalledWith(mockPrismaCv.educations);
      expect(ProjectFactory.fromPrismaArray).toHaveBeenCalledWith(mockPrismaCv.projects);
      expect(LanguageFactory.fromPrismaArray).toHaveBeenCalledWith(mockPrismaCv.languages);
      expect(SkillFactory.fromPrismaArray).toHaveBeenCalledWith(mockPrismaCv.skills);
    });

    it('should handle CV without relations', () => {
      const cvWithoutRelations = {
        id: 'cv-2',
        title: 'Minimal CV',
      };

      const result = CvFactory.fromPrisma(cvWithoutRelations as any);

      expect(result.id).toBe('cv-2');
      expect(result.experiences).toBeUndefined();
      expect(ExperienceFactory.fromPrismaArray).not.toHaveBeenCalled();
    });
  });

  describe('fromPrismaArray', () => {
    it('should map an array of Prisma CVs', () => {
      const cvs = [
        { id: 'cv-1', title: 'CV 1' },
        { id: 'cv-2', title: 'CV 2' },
      ];

      const result = CvFactory.fromPrismaArray(cvs as any);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('cv-1');
      expect(result[1].id).toBe('cv-2');
    });

    it('should return an empty array if input is empty', () => {
      const result = CvFactory.fromPrismaArray([]);
      expect(result).toEqual([]);
    });
  });
});
