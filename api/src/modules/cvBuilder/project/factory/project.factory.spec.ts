import { ProjectFactory } from './project.factory';
import { Project } from '../models/project.model';

describe('ProjectFactory', () => {
  const mockPrismaProject = {
    id: 'proj-1',
    name: 'Test Project',
    description: 'Test Desc',
    projectUrl: 'https://test.com',
    startDate: new Date('2023-01-01'),
    endDate: new Date('2023-02-01'),
    userId: 'user-1',
    cvId: 'cv-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('fromPrisma', () => {
    it('should transform prisma project to project model', () => {
      const result = ProjectFactory.fromPrisma(mockPrismaProject as any);

      expect(result).toBeInstanceOf(Project);
      expect(result.id).toBe(mockPrismaProject.id);
      expect(result.name).toBe(mockPrismaProject.name);
      expect(result.projectUrl).toBe(mockPrismaProject.projectUrl);
    });

    it('should handle relations if present', () => {
      const projectWithRelations = {
        ...mockPrismaProject,
        user: { id: 'user-1', firstName: 'Omar' },
        cv: { id: 'cv-1', title: 'My CV' },
      };

      const result = ProjectFactory.fromPrisma(projectWithRelations as any);

      expect(result.id).toBe(mockPrismaProject.id);
    });
  });

  describe('fromPrismaArray', () => {
    it('should transform an array of prisma projects', () => {
      const projects = [
        mockPrismaProject,
        { ...mockPrismaProject, id: 'proj-2', name: 'Project 2' },
      ];
      const result = ProjectFactory.fromPrismaArray(projects as any);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Project);
      expect(result[1]).toBeInstanceOf(Project);
      expect(result[1].name).toBe('Project 2');
    });

    it('should return empty array if input is empty', () => {
      const result = ProjectFactory.fromPrismaArray([]);
      expect(result).toEqual([]);
    });
  });
});
