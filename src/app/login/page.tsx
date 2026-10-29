"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/actions";
import AuthSectionOne from "@/components/ui/auth-section-1";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const fd = new FormData();
      fd.append("email", email);
      fd.append("password", password);

      const result: { error?: string; home?: string } = await login(undefined, fd);

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (result?.home) {
        router.push(result.home);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <AuthSectionOne mode="login" onLogin={handleLogin} />
  );
}
