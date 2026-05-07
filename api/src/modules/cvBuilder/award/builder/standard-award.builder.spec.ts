import { StandardAwardBuilder } from './standard-award.builder';

describe('StandardAwardBuilder', () => {
  let builder: StandardAwardBuilder;

  beforeEach(() => {
    builder = new StandardAwardBuilder();
  });

  it('should build a valid data object when all methods are called', () => {
    const mockDate = new Date('2024-01-01');
    const result = builder
      .setTitle('Excellence Award')
      .setIssuer('Tech Corp')
      .setIssueDate(mockDate)
      .setDescription('For outstanding code quality')
      .setUser('user-1')
      .setCv('cv-1')
      .build();

    expect(result).toEqual({
      title: 'Excellence Award',
      issuer: 'Tech Corp',
      issueDate: mockDate,
      description: 'For outstanding code quality',
      userId: 'user-1',
      cvId: 'cv-1',
    });
  });

  it('should allow partial building', () => {
    const result = builder
      .setTitle('Minimal Award')
      .build();

    expect(result).toEqual({
      title: 'Minimal Award',
    });
  });

  it('should reset the builder state after calling build', () => {
    builder.setTitle('First Award').build();
    const secondResult = builder.build();

    expect(secondResult).toEqual({});
  });

  it('should be fluent (return this)', () => {
    expect(builder.setTitle('Test')).toBe(builder);
    expect(builder.setIssuer('Test')).toBe(builder);
    expect(builder.setIssueDate(new Date())).toBe(builder);
    expect(builder.setDescription('Test')).toBe(builder);
    expect(builder.setUser('Test')).toBe(builder);
    expect(builder.setCv('Test')).toBe(builder);
    expect(builder.reset()).toBe(builder);
  });
});
