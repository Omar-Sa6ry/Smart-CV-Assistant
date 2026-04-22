import { CertificationFactory } from './certification.factory';
import { Certification } from '../models/certification.model';
import { CvFactory } from '../../cv/factory/cv.factory';
import { UserFactory } from 'src/modules/users/factory/user.factory';

jest.mock('../../cv/factory/cv.factory');
jest.mock('src/modules/users/factory/user.factory');

describe('CertificationFactory', () => {
  const mockPrismaCert = {
    id: 'cert-1',
    name: 'AWS Certified',
    issuingOrganization: 'Amazon',
    userId: 'user-1',
    cvId: 'cv-1',
    issueDate: new Date('2023-01-01'),
    cv: { id: 'cv-1', title: 'CV 1' },
    user: { id: 'user-1', email: 'test@test.com' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fromPrisma', () => {
    it('should map Prisma certification and relations correctly', () => {
      (CvFactory.fromPrisma as jest.Mock).mockReturnValue({ id: 'cv-mapped' });
      (UserFactory.fromPrisma as jest.Mock).mockReturnValue({ id: 'user-mapped' });

      const result = CertificationFactory.fromPrisma(mockPrismaCert as any);

      expect(result).toBeInstanceOf(Certification);
      expect(result.id).toBe('cert-1');
      expect(result.cv).toEqual({ id: 'cv-mapped' });
      expect(result.user).toEqual({ id: 'user-mapped' });

      expect(CvFactory.fromPrisma).toHaveBeenCalledWith(mockPrismaCert.cv);
      expect(UserFactory.fromPrisma).toHaveBeenCalledWith(mockPrismaCert.user);
    });

    it('should handle certification without relations', () => {
      const certWithoutRelations = {
        id: 'cert-2',
        name: 'Minimal Cert',
      };

      const result = CertificationFactory.fromPrisma(certWithoutRelations as any);

      expect(result.id).toBe('cert-2');
      expect(result.cv).toBeUndefined();
      expect(result.user).toBeUndefined();
      expect(CvFactory.fromPrisma).not.toHaveBeenCalled();
      expect(UserFactory.fromPrisma).not.toHaveBeenCalled();
    });
  });

  describe('fromPrismaArray', () => {
    it('should map an array of Prisma certifications', () => {
      const certs = [
        { id: 'cert-1', name: 'Cert 1' },
        { id: 'cert-2', name: 'Cert 2' },
      ];

      const result = CertificationFactory.fromPrismaArray(certs as any);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('cert-1');
      expect(result[1].id).toBe('cert-2');
    });
  });
});
