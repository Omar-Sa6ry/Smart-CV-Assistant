import { Permission, Role } from './enum.constant';

export const rolePermissionsMap: Record<Role, Permission[]> = {
  [Role.ADMIN]: [],

  [Role.USER]: [],
};
