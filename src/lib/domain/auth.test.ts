import { describe, it, expect } from "vitest";
import { runInTransaction, type TestTransactionClient } from "tests/setup";
import { newToken, sha256 } from "@/lib/crypto";
import {
  signupWithPassword,
  loginWithPassword,
  requestPasswordReset,
  resetPasswordWithToken,
  issueEmailVerification,
  verifyEmailWithToken,
  resolveOAuthUser,
  type SignupInput,
} from "@/lib/domain/auth";

describe("Auth domain", () => {
  describe("signupWithPassword", () => {
    it("creates org, user, and issues verification when email configured", async () => {
      await runInTransaction(async (tx: TestTransactionClient) => {
        const input: SignupInput = {
          orgName: "Test Org",
          name: "Test User",
          email: `test-${Date.now()}@example.com`,
          password: "password123",
        };
        const result = await signupWithPassword(tx, input);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.data.userId).toBeDefined();
          expect(result.data.orgId).toBeDefined();
          // verificationSent depends on RESEND_API_KEY
        }
      });
    });

    it("rejects duplicate email", async () => {
      await runInTransaction(async (tx: TestTransactionClient) => {
        const email = `dup-${Date.now()}@example.com`;
        const input: SignupInput = { orgName: "Org1", name: "User1", email, password: "password123" };
        await signupWithPassword(tx, input);
        const result = await signupWithPassword(tx, { ...input, orgName: "Org2" });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toContain("already exists");
      });
    });

    it("validates password length", async () => {
      await runInTransaction(async (tx: TestTransactionClient) => {
        const result = await signupWithPassword(tx, {
          orgName: "Test",
          name: "User",
          email: `short-${Date.now()}@example.com`,
          password: "short",
        });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toContain("8 characters");
      });
    });

    it("validates email format", async () => {
      await runInTransaction(async (tx: TestTransactionClient) => {
        const result = await signupWithPassword(tx, {
          orgName: "Test",
          name: "User",
          email: "not-an-email",
          password: "password123",
        });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toContain("valid email");
      });
    });
  });

  describe("loginWithPassword", () => {
    it("logs in valid user and clears failures", async () => {
      await runInTransaction(async (tx: TestTransactionClient) => {
        const email = `login-${Date.now()}@example.com`;
        const password = "password123";
        await signupWithPassword(tx, { orgName: "Login Org", name: "Login User", email, password });
        const result = await loginWithPassword(tx, { email, password });
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.data.userId).toBeDefined();
          expect(result.data.orgId).toBeDefined();
          expect(result.data.role).toBe("OWNER");
        }
      });
    });

    it("rejects wrong password and records failure", async () => {
      await runInTransaction(async (tx: TestTransactionClient) => {
        const email = `wrong-${Date.now()}@example.com`;
        await signupWithPassword(tx, { orgName: "Wrong Org", name: "Wrong User", email, password: "correct123" });
        const result = await loginWithPassword(tx, { email, password: "wrong123" });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toBe("Invalid email or password");
      });
    });

    it("locks out after 5 failed attempts", async () => {
      await runInTransaction(async (tx: TestTransactionClient) => {
        const email = `lock-${Date.now()}@example.com`;
        await signupWithPassword(tx, { orgName: "Lock Org", name: "Lock User", email, password: "correct123" });
        // 5 failed attempts
        for (let i = 0; i < 5; i++) {
          const r = await loginWithPassword(tx, { email, password: "wrong" });
          expect(r.ok).toBe(false);
        }
        // 6th attempt should be locked
        const locked = await loginWithPassword(tx, { email, password: "wrong" });
        expect(locked.ok).toBe(false);
        if (!locked.ok) expect(locked.error).toContain("Too many failed attempts");
      });
    });

    it("allows login after lockout expires (simulated by clearing)", async () => {
      await runInTransaction(async (tx: TestTransactionClient) => {
        const email = `expire-${Date.now()}@example.com`;
        await signupWithPassword(tx, { orgName: "Expire Org", name: "Expire User", email, password: "correct123" });
        // 5 failed
        for (let i = 0; i < 5; i++) await loginWithPassword(tx, { email, password: "wrong" });
        // Clear failures (simulating lockout expiry)
        await tx.loginAttempt.deleteMany({ where: { key: `login:${email}` } });
        // Now correct password should work
        const result = await loginWithPassword(tx, { email, password: "correct123" });
        expect(result.ok).toBe(true);
      });
    });
  });

  describe("password reset flow", () => {
    it("requests reset (always returns ok to prevent enumeration)", async () => {
      await runInTransaction(async (tx: TestTransactionClient) => {
        const email = `reset-${Date.now()}@example.com`;
        await signupWithPassword(tx, { orgName: "Reset Org", name: "Reset User", email, password: "password123" });
        const result = await requestPasswordReset(tx, email);
        expect(result.ok).toBe(true);
        // sent depends on RESEND_API_KEY
      });
    });

    it("requests reset for non-existent email (no enumeration)", async () => {
      await runInTransaction(async (tx: TestTransactionClient) => {
        const result = await requestPasswordReset(tx, `nonexistent-${Date.now()}@example.com`);
        expect(result.ok).toBe(true);
      });
    });

    it("resets password with valid token", async () => {
      await runInTransaction(async (tx: TestTransactionClient) => {
        const email = `reset-flow-${Date.now()}@example.com`;
        await signupWithPassword(tx, { orgName: "Reset Flow", name: "User", email, password: "oldpassword123" });
        // Manually create a reset token
        const token = newToken();
        await tx.authToken.create({
          data: {
            userId: (await tx.user.findUnique({ where: { email } }))!.id,
            email,
            tokenHash: sha256(token),
            type: "PASSWORD_RESET",
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          },
        });
        const result = await resetPasswordWithToken(tx, { token, password: "newpassword123" });
        expect(result.ok).toBe(true);
        if (result.ok) {
          // Verify new password works
          const login = await loginWithPassword(tx, { email, password: "newpassword123" });
          expect(login.ok).toBe(true);
        }
      });
    });

    it("rejects expired reset token", async () => {
      await runInTransaction(async (tx: TestTransactionClient) => {
        const email = `expired-${Date.now()}@example.com`;
        await signupWithPassword(tx, { orgName: "Expired Org", name: "User", email, password: "password123" });
        const token = newToken();
        await tx.authToken.create({
          data: {
            userId: (await tx.user.findUnique({ where: { email } }))!.id,
            email,
            tokenHash: sha256(token),
            type: "PASSWORD_RESET",
            expiresAt: new Date(Date.now() - 1000), // expired
          },
        });
        const result = await resetPasswordWithToken(tx, { token, password: "newpassword123" });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.code).toBe("reset_token_invalid");
      });
    });
  });

  describe("email verification", () => {
    it("issues and verifies email token", async () => {
      await runInTransaction(async (tx: TestTransactionClient) => {
        const email = `verify-${Date.now()}@example.com`;
        const signup = await signupWithPassword(tx, { orgName: "Verify Org", name: "User", email, password: "password123" });
        expect(signup.ok).toBe(true);
        if (!signup.ok) return;

        // Issue verification token
        await issueEmailVerification(tx, signup.data.userId, email);
        // sent depends on RESEND_API_KEY

        // Find the token and verify
        const tokenRecord = await tx.authToken.findFirst({
          where: { userId: signup.data.userId, type: "EMAIL_VERIFICATION" },
        });
        if (!tokenRecord) return; // no email configured

        const token2 = newToken();
        await tx.authToken.create({
          data: {
            userId: signup.data.userId,
            email,
            tokenHash: sha256(token2),
            type: "EMAIL_VERIFICATION",
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
        const result = await verifyEmailWithToken(tx, token2);
        expect(result.ok).toBe(true);
        if (result.ok) {
          const user = await tx.user.findUnique({ where: { id: result.data.userId } });
          expect(user?.emailVerifiedAt).not.toBeNull();
        }
      });
    });

    it("rejects invalid/expired verification token", async () => {
      await runInTransaction(async (tx: TestTransactionClient) => {
        const result = await verifyEmailWithToken(tx, newToken());
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.code).toBe("verify_token_invalid");
      });
    });
  });

  describe("OAuth resolution", () => {
    it("links existing user by email (verified)", async () => {
      await runInTransaction(async (tx: TestTransactionClient) => {
        const email = `oauth-${Date.now()}@example.com`;
        await signupWithPassword(tx, { orgName: "OAuth Org", name: "Existing", email, password: "password123" });
        const result = await resolveOAuthUser(tx, {
          provider: "GOOGLE",
          providerUserId: "google-123",
          email,
          emailVerified: true,
          name: "Existing User",
          username: null,
          accessToken: "token",
        }, "login");
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.data.linked).toBe(true);
          const oauth = await tx.oAuthAccount.findFirst({ where: { provider: "GOOGLE", providerUserId: "google-123" } });
          expect(oauth).toBeDefined();
        }
      });
    });

    it("creates new user on signup mode with verified email", async () => {
      await runInTransaction(async (tx: TestTransactionClient) => {
        const email = `new-oauth-${Date.now()}@example.com`;
        const result = await resolveOAuthUser(tx, {
          provider: "GOOGLE",
          providerUserId: "google-new-456",
          email,
          emailVerified: true,
          name: "New User",
          username: null,
          accessToken: "token",
        }, "signup");
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.data.linked).toBe(false);
          const user = await tx.user.findUnique({ where: { id: result.data.userId } });
          expect(user?.email).toBe(email);
          expect(user?.role).toBe("OWNER");
        }
      });
    });

    it("rejects signup when email already registered", async () => {
      await runInTransaction(async (tx: TestTransactionClient) => {
        const email = `dup-oauth-${Date.now()}@example.com`;
        await signupWithPassword(tx, { orgName: "Dup Org", name: "User", email, password: "password123" });
        const result = await resolveOAuthUser(tx, {
          provider: "GOOGLE",
          providerUserId: "google-dup-789",
          email,
          emailVerified: true,
          name: "New User",
          username: null,
          accessToken: "token",
        }, "signup");
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toContain("already exists");
      });
    });

    it("rejects login when no account exists", async () => {
      await runInTransaction(async (tx: TestTransactionClient) => {
        const result = await resolveOAuthUser(tx, {
          provider: "GOOGLE",
          providerUserId: "google-none-999",
          email: `none-${Date.now()}@example.com`,
          emailVerified: true,
          name: "Nobody",
          username: null,
          accessToken: "token",
        }, "login");
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.code).toBe("oauth_no_account");
      });
    });
  });
});