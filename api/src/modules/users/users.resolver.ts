import { UserService } from 'src/modules/users/users.service';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UpdateUserDto } from './inputs/UpdateUser.dto';
import { Permission } from 'src/common/constant/enum.constant';
import { UserResponse, UsersResponse } from './dto/UserResponse.dto';
import { EmailInput, UserIdInput } from './inputs/user.input';
import { UserFacadeService } from './fascade/user.fascade';
import { User } from './entity/user.entity';
import { CurrentUserDto } from '@bts-soft/core';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly userFacade: UserFacadeService,
    private readonly userService: UserService,
  ) {}

  @Query((returns) => UserResponse)
  async getUserById(@Args('id') id: UserIdInput): Promise<UserResponse> {
    return await this.userService.findById(id.UserId);
  }

  @Query((returns) => UserResponse)
  async getUserByEmail(
    @Args('email') email: EmailInput,
  ): Promise<UserResponse> {
    return await this.userService.findByEmail(email.email);
  }

  @Query((returns) => UsersResponse)
  async getUsers(
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<UsersResponse> {
    return await this.userService.findUsers(page, limit);
  }

  @Mutation((returns) => UserResponse)
  async updateUser(
    @Args('updateUserDto') updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    return this.userFacade.update(updateUserDto, "user.id");
  }

  @Query((returns) => UserResponse)
  async deleteUser(@Args('id') id: UserIdInput): Promise<UserResponse> {
    return await this.userFacade.deleteUser(id.UserId);
  }

  @Mutation((returns) => UserResponse)
  async UpdateUserRoleToAdmin(
    @Args('id') id: UserIdInput,
  ): Promise<UserResponse> {
    return await this.userFacade.editUserRole(id.UserId);
  }
}
