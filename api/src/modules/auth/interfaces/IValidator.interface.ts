import { User } from 'src/modules/users/entity/user.entity';

export interface IValidator {
  validate(user: User, data?: unknown): Promise<void>;
  setNext?(validator: IValidator): IValidator;
}


