import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from '../inputs/UpdateUser.dto';
import { UserResponse, UsersResponse } from '../dto/UserResponse.dto';
import { UserService } from '../users.service';

@Injectable()
export class UserFacade {
  constructor(private readonly userService: UserService) {}

  async findById(id: string): Promise<UserResponse> {
    return this.userService.findById(id);
  }

  async findByEmail(email: string): Promise<UserResponse> {
    return this.userService.findByEmail(email);
  }

  async findUsers(page?: number, limit?: number): Promise<UsersResponse> {
    return this.userService.findUsers(page, limit);
  }

  async update(
    updateUserDto: UpdateUserDto,
    id: string,
  ): Promise<UserResponse> {
    return this.userService.update(updateUserDto, id);
  }

  async deleteUser(id: string): Promise<UserResponse> {
    return this.userService.delete(id);
  }

  async editUserRole(id: string): Promise<UserResponse> {
    return this.userService.editUserRole(id);
  }
}
