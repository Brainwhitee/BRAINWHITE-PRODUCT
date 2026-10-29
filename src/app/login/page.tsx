"use client";

import { login } from "@/app/actions";
import AuthSectionOne from "@/components/ui/auth-section-1";

export default function LoginPage() {
  const handleLogin = async (email: string, password: string) => {
    try {
      const fd = new FormData();
      fd.append("email", email);
      fd.append("password", password);

      await login(undefined, fd);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      // Server action handles its own error UI via AuthSectionOne
    }
  };

  return (
    <AuthSectionOne mode="login" onLogin={handleLogin} />
  );
}
