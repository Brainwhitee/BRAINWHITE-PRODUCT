"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/actions";
import AuthSectionOne from "@/components/ui/auth-section-1";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const fd = new FormData();
      fd.append("email", email);
      fd.append("password", password);

      // @ts-expect-error - server action called from client
      const result: { error?: string } = await login(undefined, fd);

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      setIsLoading(false);
    }
  };

  const handleGitHubLogin = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/api/github/start";
    }
  };

  return (
    <AuthSectionOne mode="login" onLogin={handleEmailLogin} />
  );
}
