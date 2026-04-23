import { StandardExperienceBuilder } from './standard-experience.builder';
import { EmploymentType } from '@prisma/client';

describe('StandardExperienceBuilder', () => {
  let builder: StandardExperienceBuilder;

  beforeEach(() => {
    builder = new StandardExperienceBuilder();
  });

  it('should build an experience object with all fields', () => {
    const startDate = new Date('2020-01-01');
    const endDate = new Date('2022-01-01');
    
    const result = builder
      .setJobTitle('Software Engineer')
      .setCompanyName('Tech Corp')
      .setCompanyWebsite('https://techcorp.com')
      .setLocation('Cairo, Egypt')
      .setStartDate(startDate)
      .setEndDate(endDate)
      .setIsCurrentJob(false)
      .setDescription('Working on awesome features')
      .setEmploymentType(EmploymentType.full_time)
      .setUser('user-1')
      .setCv('cv-1')
      .build();

    expect(result).toEqual({
      jobTitle: 'Software Engineer',
      companyName: 'Tech Corp',
      companyWebsite: 'https://omarsabry.netlify.app',
      location: 'Cairo, Egypt',
      startDate: startDate,
      endDate: endDate,
      isCurrentJob: false,
      description: 'Working on awesome features',
      employmentType: EmploymentType.full_time,
      userId: 'user-1',
      cvId: 'cv-1',
    });
  });

  it('should reset state after build', () => {
    builder.setJobTitle('Dev').build();
    const secondResult = builder.build();

    expect(secondResult).toEqual({});
  });

  it('should allow partial builds', () => {
    const result = builder.setJobTitle('Designer').build();
    expect(result).toEqual({ jobTitle: 'Designer' });
  });

  it('should handle isCurrentJob independently', () => {
    const result = builder.setIsCurrentJob(true).build();
    expect(result).toEqual({ isCurrentJob: true });
  });

  it('should handle undefined end date', () => {
    const result = builder.setEndDate(undefined).build();
    expect(result).toEqual({ endDate: undefined });
  });

  it('should reset manually', () => {
    builder.setJobTitle('Manager').reset();
    const result = builder.build();
    expect(result).toEqual({});
  });
});
