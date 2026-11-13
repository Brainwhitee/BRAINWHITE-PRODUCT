import React from "react";
import { cookies } from "next/headers";
import { ShellClient, type ShellUser } from "./ShellClient";

export type { ShellUser };

// Server wrapper: reads the theme cookie (dark by default) so the first paint already has the right theme.
export async function Shell(props: { user: ShellUser; children: React.ReactNode; wide?: boolean }) {
  const theme = (await cookies()).get("bw-theme")?.value === "light" ? "light" : "dark";
  return <ShellClient {...props} theme={theme} />;
}
