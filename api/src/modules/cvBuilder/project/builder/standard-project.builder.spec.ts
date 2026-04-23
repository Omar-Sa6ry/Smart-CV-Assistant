import { StandardProjectBuilder } from './standard-project.builder';

describe('StandardProjectBuilder', () => {
  let builder: StandardProjectBuilder;

  beforeEach(() => {
    builder = new StandardProjectBuilder();
  });

  it('should build a project object with all fields', () => {
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-06-01');
    
    const result = builder
      .setName('Smart CV Assistant')
      .setDescription('AI powered CV builder')
      .setProjectUrl('https://github.com/omar/smart-cv')
      .setStartDate(startDate)
      .setEndDate(endDate)
      .setUser('user-123')
      .setCv('cv-456')
      .build();

    expect(result).toEqual({
      name: 'Smart CV Assistant',
      description: 'AI powered CV builder',
      projectUrl: 'https://github.com/omar/smart-cv',
      startDate: startDate,
      endDate: endDate,
      userId: 'user-123',
      cvId: 'cv-456',
    });
  });

  it('should reset state after build', () => {
    builder.setName('Temp').build();
    const result = builder.build();
    expect(result).toEqual({});
  });

  it('should allow partial builds', () => {
    const result = builder.setName('Part').build();
    expect(result).toEqual({ name: 'Part' });
  });

  it('should handle undefined dates', () => {
    const result = builder.setStartDate(undefined).setEndDate(undefined).build();
    expect(result).toEqual({ startDate: undefined, endDate: undefined });
  });

  it('should reset state manually', () => {
    builder.setName('To be reset').reset();
    const result = builder.build();
    expect(result).toEqual({});
  });
});
