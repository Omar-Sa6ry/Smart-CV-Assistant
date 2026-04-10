import { registerEnumType } from '@nestjs/graphql';

export enum Role {
  ADMIN = 'admin',
  USER = 'user',
}
export const AllRoles: Role[] = Object.values(Role);

export enum Permission {}

registerEnumType(Permission, {
  name: 'Permission',
  description: 'Detailed permissions in the system',
});

registerEnumType(Role, {
  name: 'Role',
  description: 'User roles in the system',
});
