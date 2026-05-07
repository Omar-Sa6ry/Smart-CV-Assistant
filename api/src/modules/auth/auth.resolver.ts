import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { User } from '../users/entity/user.entity';
import { AuthResponse } from './dto/AuthRes.dto';
import { CreateUserDto } from './inputs/CreateUserData.dto';
import { LoginDto } from './inputs/Login.dto';
import { ResetPasswordDto } from './inputs/ResetPassword.dto';
import { ChangePasswordDto } from './inputs/ChangePassword.dto';
import { CurrentUser } from 'src/common/decorator/currentUser.decorator';
import { Permission, Role } from 'src/common/constant/enum.constant';
import { Auth } from 'src/common/decorator/auth.decorator';
import { UserResponse } from '../users/dto/UserResponse.dto';
import { CurrentUserDto } from '@bts-soft/core';
import { AuthFacade } from './facade/auth.facade';


@Resolver(() => User)
export class AuthResolver {
  constructor(private readonly authFacade: AuthFacade) {}

  @Mutation(() => AuthResponse)
  async register(
    @Args('createUserDto') createUserDto: CreateUserDto,
  ): Promise<AuthResponse> {
    return this.authFacade.register(createUserDto);
  }

  @Mutation(() => AuthResponse)
  async login(@Args('loginDto') loginDto: LoginDto): Promise<AuthResponse> {
    return this.authFacade.login(loginDto);
  }


  @Mutation(() => AuthResponse)
  async loginAsAdmin(@Args('loginDto') loginDto: LoginDto): Promise<AuthResponse> {
    return this.authFacade.roleBasedLogin(loginDto, Role.ADMIN);
  }

  @Mutation(() => AuthResponse)
  @Auth([Permission.FORGOT_PASSWORD])
  async forgotPassword(
    @CurrentUser() user: CurrentUserDto,
  ): Promise<AuthResponse> {
    return this.authFacade.forgotPassword(user.email);
  }

  @Mutation(() => UserResponse)
  @Auth([Permission.RESET_PASSWORD])
  async resetPassword(
    @Args('resetPasswordDto') resetPasswordDto: ResetPasswordDto,
  ): Promise<UserResponse> {
    return this.authFacade.resetPassword(resetPasswordDto);
  }

  @Mutation(() => UserResponse)
  @Auth([Permission.CHANGE_PASSWORD])
  async changePassword(
    @CurrentUser() user: CurrentUserDto,
    @Args('changePasswordDto') changePasswordDto: ChangePasswordDto,
  ): Promise<UserResponse> {
    return this.authFacade.changePassword(user?.id, changePasswordDto);
  }
}
