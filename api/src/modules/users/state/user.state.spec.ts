import { UserRoleContext } from './user.state';
import { User } from 'src/modules/users/entity/user.entity';
import { Role } from 'src/common/constant/enum.constant';

describe('UserRoleContext (State Pattern)', () => {
  let user: User;

  beforeEach(() => {
    user = new User();
  });

  describe('Promotion', () => {
    it('should promote a USER to ADMIN', async () => {
      user.role = Role.USER;
      const context = new UserRoleContext(user);
      
      const result = await context.promote(user);
      
      expect(result.role).toBe(Role.ADMIN);
    });

    it('should keep an ADMIN as ADMIN when promoting', async () => {
      user.role = Role.ADMIN;
      const context = new UserRoleContext(user);
      
      const result = await context.promote(user);
      
      expect(result.role).toBe(Role.ADMIN);
    });
  });

  describe('Demotion', () => {
    it('should demote an ADMIN to USER', async () => {
      user.role = Role.ADMIN;
      const context = new UserRoleContext(user);
      
      const result = await context.demote(user);
      
      expect(result.role).toBe(Role.USER);
    });

    it('should keep a USER as USER when demoting', async () => {
      user.role = Role.USER;
      const context = new UserRoleContext(user);
      
      const result = await context.demote(user);
      
      expect(result.role).toBe(Role.USER);
    });
  });

  it('should throw error for invalid role in constructor', () => {
    user.role = 'INVALID' as any;
    expect(() => new UserRoleContext(user)).toThrow('Invalid role');
  });
});
