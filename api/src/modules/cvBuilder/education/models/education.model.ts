import { Field, ObjectType, registerEnumType, Float } from '@nestjs/graphql';
import { User } from 'src/modules/users/entity/user.entity';
import { Type } from 'class-transformer';
import { Cv } from '../../cv/models/cv.model';
import { Degree } from '@prisma/client';

registerEnumType(Degree, {
  name: 'Degree',
  description: 'Education degree levels',
});

@ObjectType()
export class Education {
  userId: string;
  cvId: string;

  @Field(() => String)
  id: string;

  @Field(() => String)
  institution: string;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  location?: string | null;

  @Field(() => String)
  description: string;

  @Field(() => Degree)
  degree: Degree;

  @Field(() => Float, { nullable: true })
  gpa?: number | null;

  @Field(() => Boolean)
  isCurrent: boolean;

  @Field(() => Date)
  startDate: Date;

  @Field(() => Date, { nullable: true })
  endDate?: Date | null;

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
