import { StandardCvBuilder } from './standard-cv.builder';

describe('StandardCvBuilder', () => {
  let builder: StandardCvBuilder;

  beforeEach(() => {
    builder = new StandardCvBuilder();
  });

  it('should initialize with an empty CV object', () => {
    const result = builder.build();
    expect(result).toEqual({});
  });

  it('should set all fields correctly', () => {
    const result = builder
      .setTitle('Title')
      .setSummary('Summary')
      .setUser('user-123')
      .setIsDefault(true)
      .setPhone('123456789')
      .setGithub('github.com/user')
      .setPortfolio('portfolio.com')
      .setLinkedin('linkedin.com/user')
      .setHeadline('Headline')
      .setLocation('Location')
      .build();

    expect(result).toEqual({
      title: 'Title',
      summary: 'Summary',
      userId: 'user-123',
      isDefault: true,
      phone: '123456789',
      github: 'github.com/user',
      portfolio: 'portfolio.com',
      linkedin: 'linkedin.com/user',
      headline: 'Headline',
      location: 'Location',
    });
  });

  it('should reset the builder after build', () => {
    builder.setTitle('Title').build();
    const secondResult = builder.build();
    expect(secondResult).toEqual({});
  });

  it('should not set github, portfolio, or linkedin if value is undefined', () => {
    const result = builder
      .setGithub(undefined)
      .setPortfolio(undefined)
      .setLinkedin(undefined)
      .build();

    expect(result).toEqual({});
  });

  it('should allow setting phone via setIsPhone redundant method', () => {
    const result = builder.setIsPhone('987654321').build();
    expect(result.phone).toBe('987654321');
  });

  it('should allow explicit reset', () => {
    builder.setTitle('Title').reset();
    const result = builder.build();
    expect(result).toEqual({});
  });
});
