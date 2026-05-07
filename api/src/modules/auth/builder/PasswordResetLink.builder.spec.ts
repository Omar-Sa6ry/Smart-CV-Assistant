import { PasswordResetLinkBuilder } from './PasswordResetLink.builder';

describe('PasswordResetLinkBuilder', () => {
  it('should generate a 64-character hex token by default', () => {
    const builder = new PasswordResetLinkBuilder();
    const token = builder.getToken();
    
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it('should build a reset link containing the token', () => {
    const builder = new PasswordResetLinkBuilder();
    const token = builder.getToken();
    const link = builder.build();

    expect(link).toContain('http://localhost:3000/graphql/reset-password');
    expect(link).toContain(`token=${token}`);
  });

  it('should generate unique tokens for different instances', () => {
    const builder1 = new PasswordResetLinkBuilder();
    const builder2 = new PasswordResetLinkBuilder();
    
    expect(builder1.getToken()).not.toBe(builder2.getToken());
  });
});
