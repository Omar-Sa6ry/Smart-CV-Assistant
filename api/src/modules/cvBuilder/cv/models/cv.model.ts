import { Field, ObjectType } from '@nestjs/graphql';
import { User } from 'src/modules/users/entity/user.entity';
import { Type } from 'class-transformer';
import { Experience } from '../../experience/models/experience.model';
import { Education } from '../../education/models/education.model';
import { Certification } from '../../certification/models/certification.model';

@ObjectType()
export class Cv {
  userId: string;

  @Field(() => String)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  summary: string;

  @Field(() => Boolean)
  isDefault: boolean;

  @Field(() => User, { nullable: true })
  @Type(() => User)
  user?: User | null;

  @Field(() => [Experience], { nullable: true })
  @Type(() => Experience)
  experiences?: Experience[] | null;

  @Field(() => [Education], { nullable: true })
  @Type(() => Education)
  educations?: Education[] | null;

  @Field(() => [Certification], { nullable: true })
  @Type(() => Certification)
  certifications?: Certification[] | null;

  @Field(() => Date, { nullable: true })
  createdAt?: Date | null;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date | null;
}
