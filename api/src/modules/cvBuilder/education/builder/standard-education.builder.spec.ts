import { Degree } from '@prisma/client';
import { StandardEducationBuilder } from './standard-education.builder';

describe('StandardEducationBuilder', () => {
  let builder: StandardEducationBuilder;

  beforeEach(() => {
    builder = new StandardEducationBuilder();
  });

  it('should initialize with an empty education object', () => {
    const result = builder.build();
    expect(result).toEqual({});
  });

  it('should set all fields correctly', () => {
    const startDate = new Date('2020-01-01');
    const endDate = new Date('2024-01-01');
    const result = builder
      .setInstitution('University of Science')
      .setTitle('Computer Science')
      .setLocation('New York')
      .setDescription('Studied computer science')
      .setDegree(Degree.bachelor)
      .setGpa(3.8)
      .setIsCurrent(false)
      .setStartDate(startDate)
      .setEndDate(endDate)
      .setUser('user-1')
      .setCv('cv-1')
      .build();

    expect(result).toEqual({
      institution: 'University of Science',
      title: 'Computer Science',
      location: 'New York',
      description: 'Studied computer science',
      degree: Degree.bachelor,
      gpa: 3.8,
      isCurrent: false,
      startDate: startDate,
      endDate: endDate,
      userId: 'user-1',
      cvId: 'cv-1',
    });
  });

  it('should reset the builder after build', () => {
    builder.setInstitution('Uni').build();
    const secondResult = builder.build();
    expect(secondResult).toEqual({});
  });

  it('should allow explicit reset', () => {
    builder.setInstitution('Uni').reset();
    const result = builder.build();
    expect(result).toEqual({});
  });
});
