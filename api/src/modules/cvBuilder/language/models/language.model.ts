import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { User } from 'src/modules/users/entity/user.entity';
import { Type } from 'class-transformer';
import { Cv } from '../../cv/models/cv.model';
import { Proficiency } from '@prisma/client';

registerEnumType(Proficiency, {
  name: 'Proficiency',
  description: 'Language proficiency levels',
});

@ObjectType()
export class Language {
  userId: string;
  cvId: string;

  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => Proficiency)
  proficiency: Proficiency;

  @Field(() => Date, { nullable: true })
  createdAt?: Date | null;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date | null;

  @Field(() => User, { nullable: true })
  @Type(() => User)
  user?: User | null;

  @Field(() => Cv, { nullable: true })
  @Type(() => Cv)
  cv?: Cv | null;
}
