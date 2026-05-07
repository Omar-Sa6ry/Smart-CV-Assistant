import { StandardCertificationBuilder } from './standard-certification.builder';

describe('StandardCertificationBuilder', () => {
  let builder: StandardCertificationBuilder;

  beforeEach(() => {
    builder = new StandardCertificationBuilder();
  });

  it('should initialize with an empty certification object', () => {
    const result = builder.build();
    expect(result).toEqual({});
  });

  it('should set all fields correctly', () => {
    const issueDate = new Date('2023-01-01');
    const result = builder
      .setName('AWS Certified')
      .setIssuingOrganization('Amazon')
      .setCredentialId('ID-123')
      .setCredentialUrl('http://aws.com/cert')
      .setIssueDate(issueDate)
      .setUser('user-1')
      .setCv('cv-1')
      .build();

    expect(result).toEqual({
      name: 'AWS Certified',
      issuingOrganization: 'Amazon',
      credentialId: 'ID-123',
      credentialUrl: 'http://aws.com/cert',
      issueDate: issueDate,
      userId: 'user-1',
      cvId: 'cv-1',
    });
  });

  it('should reset the builder after build', () => {
    builder.setName('Cert 1').build();
    const secondResult = builder.build();
    expect(secondResult).toEqual({});
  });

  it('should allow explicit reset', () => {
    builder.setName('Cert 1').reset();
    const result = builder.build();
    expect(result).toEqual({});
  });

  it('should handle optional credentialId being undefined', () => {
    const result = builder.setCredentialId(undefined).build();
    expect(result).toHaveProperty('credentialId', undefined);
  });
});
