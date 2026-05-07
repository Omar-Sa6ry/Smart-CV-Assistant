import { StandardSkillBuilder } from './standard-skill.builder';
import { SkillProficiency } from '@prisma/client';

describe('StandardSkillBuilder', () => {
  let builder: StandardSkillBuilder;

  beforeEach(() => {
    builder = new StandardSkillBuilder();
  });

  it('should build a skill with all fields', () => {
    const result = builder
      .setName('TypeScript')
      .setProficiency(SkillProficiency.expert)
      .setUser('user-id')
      .setCv('cv-id')
      .setKeyword('kw-id')
      .build();

    expect(result).toEqual({
      name: 'TypeScript',
      proficiency: SkillProficiency.expert,
      userId: 'user-id',
      cvId: 'cv-id',
      keywordId: 'kw-id',
    });
  });

  it('should allow null keywordId', () => {
    const result = builder
      .setName('Node.js')
      .setKeyword(null)
      .build();

    expect(result.keywordId).toBeNull();
  });

  it('should reset after build', () => {
    builder.setName('TypeScript').build();
    const result = builder.build();
    expect(result).toEqual({});
  });

  it('should reset explicitly', () => {
    builder.setName('TypeScript').reset();
    const result = builder.build();
    expect(result).toEqual({});
  });
});
