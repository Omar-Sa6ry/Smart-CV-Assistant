import { Field, ObjectType, registerEnumType, Int } from '@nestjs/graphql';
import { SkillCategory } from '@prisma/client';

registerEnumType(SkillCategory, {
  name: 'SkillCategory',
  description: 'Categories for skill keywords',
});

@ObjectType()
export class SkillKeyword {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => SkillCategory)
  category: SkillCategory;

  @Field(() => Int)
  popularityScore: number;

  @Field(() => Boolean)
  isVerified: boolean;

  @Field(() => Date)
  createdAt: Date;
}
