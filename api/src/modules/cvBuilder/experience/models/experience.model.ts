import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { User } from 'src/modules/users/entity/user.entity';
import { Type } from 'class-transformer';
import { Cv } from '../../cv/models/cv.model';
import { EmploymentType } from '@prisma/client';

registerEnumType(EmploymentType, {
  name: 'EmploymentType',
  description: 'EmploymentType in the system',
});

@ObjectType()
export class Experience {
  userId: string;
  cvId: string;

  @Field(() => String)
  id: string;

  @Field(() => String)
  jobTitle: string;

  @Field(() => String)
  companyName: string;

  @Field(() => String)
  companyWebsite: string;

  @Field(() => String)
  description: string;

  @Field(() => [String], { nullable: true })
  descriptionBullets?: string[];

  @Field(() => String, { nullable: true })
  achievements?: string | null;

  @Field(() => String)
  location: string;

  @Field(() => Boolean)
  isCurrentJob: boolean;

  @Field(() => EmploymentType)
  employmentType: EmploymentType;

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
