import { Metadata } from "next";
import AuthSectionOne from "@/components/ui/auth-section-1";

export const metadata: Metadata = {
  title: "Create account | Brainwhite",
  description: "Create your Brainwhite organisation",
};

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolvedParams = await searchParams;
  const initialError = resolvedParams.error;
  return <AuthSectionOne mode="signup" initialError={initialError} />;
}