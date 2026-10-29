"use client";

import { signupOrg } from "@/app/actions";
import AuthSectionOne from "@/components/ui/auth-section-1";

export default function SignupPage() {
  const handleEmailSignup = async (orgName: string, name: string, email: string, password: string) => {
    try {
      const fd = new FormData();
      fd.append("orgName", orgName);
      fd.append("name", name);
      fd.append("email", email);
      fd.append("password", password);

      await signupOrg(undefined, fd);
    } catch (err: unknown) {
      // Server action handles its own error UI via AuthSectionOne
    }
  };

  return (
    <AuthSectionOne mode="signup" onSignup={handleEmailSignup} />
  );
}
