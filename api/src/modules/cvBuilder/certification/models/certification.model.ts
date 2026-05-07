import { Field, ObjectType } from '@nestjs/graphql';
import { User } from 'src/modules/users/entity/user.entity';
import { Type } from 'class-transformer';
import { Cv } from '../../cv/models/cv.model';

@ObjectType()
export class Certification {
  userId: string;
  cvId: string;

  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  issuingOrganization: string;

  @Field(() => String, { nullable: true })
  credentialId?: string | null;

  @Field(() => String)
  credentialUrl: string;

  @Field(() => Date)
  issueDate: Date;

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
