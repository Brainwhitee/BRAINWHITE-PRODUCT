"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signupOrg } from "@/app/actions";
import AuthSectionOne from "@/components/ui/auth-section-1";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSignup = async (orgName: string, name: string, email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const fd = new FormData();
      fd.append("orgName", orgName);
      fd.append("name", name);
      fd.append("email", email);
      fd.append("password", password);

      const result: { error?: string } | undefined = await signupOrg(undefined, fd);

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <AuthSectionOne mode="signup" onSignup={handleEmailSignup} />
  );
}
