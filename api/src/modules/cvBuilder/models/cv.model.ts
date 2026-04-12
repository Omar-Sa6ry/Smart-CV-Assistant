import { Field, ObjectType } from '@nestjs/graphql';
import { User } from 'src/modules/users/entity/user.entity';

@ObjectType()
export class Cv {
  @Field(() => String)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => Boolean)
  isDefault: boolean;

  @Field(() => User, { nullable: true })
  user?: User | null;

  @Field(() => Date, { nullable: true })
  createdAt?: Date | null;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date | null;
}
