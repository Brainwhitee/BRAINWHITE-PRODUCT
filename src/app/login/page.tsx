import { Metadata } from "next";
import AuthSectionOne from "@/components/ui/auth-section-1";

export const metadata: Metadata = {
  title: "Sign in | Brainwhite",
  description: "Sign in to your Brainwhite workspace",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolvedParams = await searchParams;
  const initialError = resolvedParams.error;
  return <AuthSectionOne mode="login" initialError={initialError} />;
}