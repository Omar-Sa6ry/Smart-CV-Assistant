import { InitialResetState, CompletedResetState, PasswordResetContext } from './auth.state';
import { User } from 'src/modules/users/entity/user.entity';

describe('PasswordResetState (State Pattern)', () => {
  let user: User;

  beforeEach(() => {
    user = new User();
  });

  describe('InitialResetState', () => {
    it('should set token and expiry on user', async () => {
      const state = new InitialResetState();
      const token = 'test-token';

      await state.handle(user, token);

      expect(user.resetToken).toBe(token);
      expect(user.resetTokenExpiry).toBeDefined();
      expect(user.resetTokenExpiry!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should throw error if token is missing', async () => {
      const state = new InitialResetState();
      await expect(state.handle(user)).rejects.toThrow('Token is required for initial reset state');
    });
  });

  describe('CompletedResetState', () => {
    it('should clear token and expiry on user', async () => {
      user.resetToken = 'old-token';
      user.resetTokenExpiry = new Date();
      const state = new CompletedResetState();

      await state.handle(user);

      expect(user.resetToken).toBeNull();
      expect(user.resetTokenExpiry).toBeNull();
    });
  });

  describe('PasswordResetContext', () => {
    it('should execute the current state handle method', async () => {
      const mockState = { handle: jest.fn() };
      const context = new PasswordResetContext(mockState as any);
      const token = 'some-token';

      await context.execute(user, token);

      expect(mockState.handle).toHaveBeenCalledWith(user, token);
    });

    it('should allow changing state', async () => {
      const state1 = { handle: jest.fn() };
      const state2 = { handle: jest.fn() };
      const context = new PasswordResetContext(state1 as any);

      await context.execute(user);
      expect(state1.handle).toHaveBeenCalled();

      context.setState(state2 as any);
      await context.execute(user);
      expect(state2.handle).toHaveBeenCalled();
    });
  });
});
