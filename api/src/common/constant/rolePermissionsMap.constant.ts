import { Permission, Role } from './enum.constant';

export const rolePermissionsMap: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    // User
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.EDIT_USER_ROLE,
    Permission.RESET_PASSWORD,
    Permission.CHANGE_PASSWORD,
    Permission.FORGOT_PASSWORD,
    Permission.LOGOUT,
    Permission.VIEW_USER,

    //CV
    Permission.CREATE_CV,
    Permission.GET_CV,
    Permission.GET_USERS_CV,
    Permission.UPDATE_CV,
    Permission.DELETE_CV,

    // Education
    Permission.CREATE_EDUCATION,
    Permission.GET_EDUCATION,
    Permission.UPDATE_EDUCATION,
    Permission.DELETE_EDUCATION,

    // Experience
    Permission.CREATE_EXPERIENCE,
    Permission.GET_EXPERIENCE,
    Permission.UPDATE_EXPERIENCE,
    Permission.DELETE_EXPERIENCE,

    // Certificate
    Permission.CREATE_CERTIFICATION,
    Permission.GET_CERTIFICATION,
    Permission.UPDATE_CERTIFICATION,
    Permission.DELETE_CERTIFICATION,

    // Projects
    Permission.CREATE_PROJECT,
    Permission.GET_PROJECT,
    Permission.DELETE_PROJECT,
    Permission.UPDATE_PROJECT,
  ],

  [Role.USER]: [
    // User
    Permission.UPDATE_USER,
    Permission.RESET_PASSWORD,
    Permission.CHANGE_PASSWORD,
    Permission.FORGOT_PASSWORD,
    Permission.LOGOUT,

    //CV
    Permission.CREATE_CV,
    Permission.GET_CV,
    Permission.GET_USERS_CV,
    Permission.UPDATE_CV,
    Permission.DELETE_CV,

    // Education
    Permission.CREATE_EDUCATION,
    Permission.GET_EDUCATION,
    Permission.UPDATE_EDUCATION,
    Permission.DELETE_EDUCATION,

    // Experience
    Permission.CREATE_EXPERIENCE,
    Permission.GET_EXPERIENCE,
    Permission.UPDATE_EXPERIENCE,
    Permission.DELETE_EXPERIENCE,

    // Certificate
    Permission.CREATE_CERTIFICATION,
    Permission.GET_CERTIFICATION,
    Permission.UPDATE_CERTIFICATION,
    Permission.DELETE_CERTIFICATION,

    // Projects
    Permission.CREATE_PROJECT,
    Permission.GET_PROJECT,
    Permission.DELETE_PROJECT,
    Permission.UPDATE_PROJECT,
  ],
};
