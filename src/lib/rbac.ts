export type Role = "OWNER" | "MANAGER" | "MENTOR" | "CANDIDATE";

export const PERMISSIONS = {
  "org:settings": ["OWNER", "MANAGER"],
  "members:view": ["OWNER", "MANAGER", "MENTOR"],
  "members:invite": ["OWNER", "MANAGER"],
  "members:deactivate": ["OWNER", "MANAGER"],
  "members:change-role": ["OWNER"],
  "audit:view": ["OWNER"],
  "codebase:manage": ["OWNER", "MANAGER"],
  "codebase:view": ["OWNER", "MANAGER", "MENTOR"],
  "paths:manage": ["OWNER", "MANAGER"],
  "learning:own": ["OWNER", "MANAGER", "MENTOR", "CANDIDATE"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export const can = (role: string, perm: Permission) =>
  (PERMISSIONS[perm] as readonly string[]).includes(role);
