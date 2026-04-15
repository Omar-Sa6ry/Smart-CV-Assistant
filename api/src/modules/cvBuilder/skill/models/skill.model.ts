import { Field, ObjectType, registerEnumType, Int } from '@nestjs/graphql';
import { User } from 'src/modules/users/entity/user.entity';
import { Type } from 'class-transformer';
import { Cv } from '../../cv/models/cv.model';
import { SkillProficiency } from '@prisma/client';
import { SkillKeyword } from './skill-keyword.model';

registerEnumType(SkillProficiency, {
  name: 'SkillProficiency',
  description: 'Skill proficiency levels',
});

@ObjectType()
export class Skill {
  userId: string;
  cvId: string;
  keywordId?: string | null;

  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => SkillProficiency)
  proficiency: SkillProficiency;

  @Field(() => Int, { nullable: true })
  yearsOfExperience?: number | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => User, { nullable: true })
  @Type(() => User)
  user?: User | null;

  @Field(() => Cv, { nullable: true })
  @Type(() => Cv)
  cv?: Cv | null;

  @Field(() => SkillKeyword, { nullable: true })
  @Type(() => SkillKeyword)
  keyword?: SkillKeyword | null;
}
