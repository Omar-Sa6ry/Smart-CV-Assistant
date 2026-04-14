import { Field, ObjectType, Int } from '@nestjs/graphql';
import { User } from 'src/modules/users/entity/user.entity';
import { Type } from 'class-transformer';
import { Cv } from '../../cv/models/cv.model';

@ObjectType()
export class Project {
  userId: string;
  cvId: string;

  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => [String], { nullable: true })
  descriptionBullets?: string[];

  @Field(() => String, { nullable: true })
  technologiesUsed?: string | null;

  @Field(() => String, { nullable: true })
  projectUrl?: string | null;

  @Field(() => Boolean)
  isPersonalProject: boolean;

  @Field(() => Date, { nullable: true })
  startDate?: Date | null;

  @Field(() => Date, { nullable: true })
  endDate?: Date | null;

  @Field(() => Boolean)
  isTeamProject: boolean;

  @Field(() => Int)
  teamSize: number;

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
