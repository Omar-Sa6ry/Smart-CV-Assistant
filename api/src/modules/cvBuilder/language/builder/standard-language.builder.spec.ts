import { StandardLanguageBuilder } from './standard-language.builder';
import { Proficiency } from '@prisma/client';

describe('StandardLanguageBuilder', () => {
  let builder: StandardLanguageBuilder;

  beforeEach(() => {
    builder = new StandardLanguageBuilder();
  });

  it('should build a language object with all fields', () => {
    const result = builder
      .setName('Arabic')
      .setProficiency(Proficiency.native)
      .setUser('user-123')
      .setCv('cv-456')
      .build();

    expect(result).toEqual({
      name: 'Arabic',
      proficiency: Proficiency.native,
      userId: 'user-123',
      cvId: 'cv-456',
    });
  });

  it('should reset state after build', () => {
    builder.setName('French').build();
    const secondResult = builder.build();

    expect(secondResult).toEqual({});
  });

  it('should allow partial builds', () => {
    const result = builder.setName('German').build();
    expect(result).toEqual({ name: 'German' });
  });

  it('should reset manually', () => {
    builder.setName('Spanish').reset();
    const result = builder.build();
    expect(result).toEqual({});
  });
});
