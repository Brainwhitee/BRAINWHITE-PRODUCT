export type UserRole = "developer" | "team-lead" | "manager" | "admin";

export interface NavDropdownItem {
  id: string;
  title: string;
  description: string;
  href: string;
  badge?: string;
  iconName: string;
  requiredRole?: UserRole[];
}

export interface NavGroup {
  id: string;
  title: string;
  href?: string; // Direct link if not a dropdown
  items?: NavDropdownItem[];
  requiredRole?: UserRole[];
}

export interface RoleConfig {
  role: UserRole;
  displayName: string;
  badgeLabel: string;
  badgeVariant: "dev" | "lead" | "manager" | "admin";
  homeRoute: string;
  ctaLabel: string;
  ctaHref?: string;
  ctaAction?: "resume_quest" | "review_prs" | "provision_dev" | "nudge_team";
  allowedRoutes: string[];
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  developer: {
    role: "developer",
    displayName: "Staff Developer",
    badgeLabel: "DEV",
    badgeVariant: "dev",
    homeRoute: "/dev",
    ctaLabel: "Resume Quest",
    ctaHref: "/developer/learning-path",
    ctaAction: "resume_quest",
    allowedRoutes: [
      "/dev",
      "/developer/home",
      "/developer/learning-path",
      "/developer/qa",
      "/developer/readiness",
      "/developer/assessments",
      "/developer/tasks",
      "/developer/project-explorer",
      "/developer/profile",
    ],
  },
  "team-lead": {
    role: "team-lead",
    displayName: "Engineering Team Lead",
    badgeLabel: "LEAD",
    badgeVariant: "lead",
    homeRoute: "/manage",
    ctaLabel: "Review PRs",
    ctaHref: "/developer/tasks",
    ctaAction: "review_prs",
    allowedRoutes: [
      "/dev",
      "/manage",
      "/team-lead/dashboard",
      "/developer/home",
      "/developer/learning-path",
      "/developer/qa",
      "/developer/readiness",
      "/developer/assessments",
      "/developer/tasks",
      "/developer/project-explorer",
      "/manager/overview",
      "/manager/readiness",
      "/manager/developers",
      "/manager/skill-gaps",
    ],
  },
  manager: {
    role: "manager",
    displayName: "Engineering Manager",
    badgeLabel: "MGR",
    badgeVariant: "manager",
    homeRoute: "/manage",
    ctaLabel: "Cohort Pulse",
    ctaHref: "/manager/overview",
    ctaAction: "nudge_team",
    allowedRoutes: [
      "/dev",
      "/manage",
      "/developer/home",
      "/developer/learning-path",
      "/developer/qa",
      "/developer/readiness",
      "/developer/assessments",
      "/developer/tasks",
      "/developer/project-explorer",
      "/manager/overview",
      "/manager/readiness",
      "/manager/developers",
      "/manager/skill-gaps",
      "/manager/onboarding",
      "/manager/analytics",
    ],
  },
  admin: {
    role: "admin",
    displayName: "Lead Architect / Admin",
    badgeLabel: "ADMIN",
    badgeVariant: "admin",
    homeRoute: "/admin",
    ctaLabel: "Provision Dev",
    ctaAction: "provision_dev",
    allowedRoutes: [
      "/dev",
      "/manage",
      "/admin",
      "/developer/home",
      "/developer/learning-path",
      "/developer/qa",
      "/developer/readiness",
      "/developer/assessments",
      "/developer/tasks",
      "/developer/project-explorer",
      "/manager/overview",
      "/manager/readiness",
      "/manager/developers",
      "/manager/skill-gaps",
      "/manager/onboarding",
      "/manager/analytics",
      "/admin/repositories",
      "/admin/projects",
      "/admin/knowledge",
      "/admin/organization",
      "/admin/team",
    ],
  },
};

/**
 * Global Navigation Menu Configuration.
 * Filtered by user permissions/role at runtime.
 */
export const NAVIGATION_STRUCTURE: NavGroup[] = [
  {
    id: "overview",
    title: "Overview",
    href: "/dev", // Dynamic based on role
  },
  {
    id: "learn",
    title: "Learn",
    items: [
      {
        id: "quest-path",
        title: "Quest Path",
        description: "Interactive DAG dependency learning roadmap & milestone tracks",
        href: "/developer/learning-path",
        badge: "DAG",
        iconName: "GitBranch",
      },
      {
        id: "assessments",
        title: "Assessments",
        description: "Architectural challenges, quizzes and validated scorecards",
        href: "/developer/assessments",
        badge: "Scorecards",
        iconName: "GraduationCap",
      },
    ],
  },
  {
    id: "code-intelligence",
    title: "Code Intelligence",
    items: [
      {
        id: "ast-copilot",
        title: "AST Copilot",
        description: "Codebase semantic graph Q&A and exact symbol navigation",
        href: "/developer/qa",
        badge: "Graph",
        iconName: "Cpu",
      },
      {
        id: "project-explorer",
        title: "Project Explorer",
        description: "Indexed file hierarchy, symbol dependencies & commit graph",
        href: "/developer/project-explorer",
        iconName: "FolderTree",
      },
    ],
  },
  {
    id: "readiness",
    title: "Readiness",
    items: [
      {
        id: "readiness-ledger",
        title: "Readiness Ledger",
        description: "Engineering velocity, verifiable competency proof & readiness score",
        href: "/developer/readiness",
        badge: "Evidence",
        iconName: "ShieldCheck",
      },
      {
        id: "audit-evidence",
        title: "Audit Evidence Log",
        description: "Cryptographically verified audit trail with SHA-256 receipts",
        href: "/admin/organization#audit",
        badge: "SHA-256",
        iconName: "Lock",
        requiredRole: ["manager", "admin"],
      },
    ],
  },
  {
    id: "work",
    title: "Work",
    items: [
      {
        id: "tasks-prs",
        title: "Tasks & PRs",
        description: "Assigned sprint tasks, pull request reviews & readiness milestones",
        href: "/developer/tasks",
        badge: "Sprint",
        iconName: "GitPullRequest",
      },
    ],
  },
  {
    id: "management",
    title: "Management",
    requiredRole: ["team-lead", "manager", "admin"],
    items: [
      {
        id: "team-overview",
        title: "Cohort Overview",
        description: "Team readiness telemetry, onboarding funnel & sprint velocity",
        href: "/manager/overview",
        iconName: "BarChart3",
        requiredRole: ["manager", "admin"],
      },
      {
        id: "dev-roster",
        title: "Developer Roster",
        description: "Individual developer drill-down, progress tracking & unblock actions",
        href: "/manager/developers",
        badge: "Active",
        iconName: "Users",
        requiredRole: ["team-lead", "manager", "admin"],
      },
      {
        id: "skill-gaps",
        title: "Skill Gap Matrix",
        description: "Aggregated architectural blindspots across backend, frontend & db",
        href: "/manager/skill-gaps",
        badge: "Matrix",
        iconName: "TrendingUp",
        requiredRole: ["team-lead", "manager", "admin"],
      },
    ],
  },
  {
    id: "admin",
    title: "Admin",
    requiredRole: ["admin"],
    items: [
      {
        id: "repositories",
        title: "Repositories & Ingestion",
        description: "GitHub synchronization, Tree-sitter AST extraction & indexer status",
        href: "/admin/repositories",
        badge: "Engine",
        iconName: "Database",
      },
      {
        id: "team-rbac",
        title: "Team Access & Provisioning",
        description: "Developer account creation, role assignments & token revocation",
        href: "/admin/team",
        badge: "RBAC",
        iconName: "KeyRound",
      },
      {
        id: "organization-sso",
        title: "Organization & SSO",
        description: "Enterprise tenant settings, SAML SSO & cryptographic audit ledger",
        href: "/admin/organization",
        iconName: "Building2",
      },
    ],
  },
];

/**
 * Filter navigation configuration based on role.
 */
export function getNavForRole(role: UserRole): NavGroup[] {
  const roleConfig = ROLE_CONFIGS[role] || ROLE_CONFIGS.developer;

  return NAVIGATION_STRUCTURE.filter((group) => {
    if (group.requiredRole && !group.requiredRole.includes(role)) {
      return false;
    }
    return true;
  }).map((group) => {
    // If overview, map directly to role's primary home
    if (group.id === "overview") {
      return {
        ...group,
        href: roleConfig.homeRoute,
      };
    }

    if (group.items) {
      const filteredItems = group.items.filter((item) => {
        if (item.requiredRole && !item.requiredRole.includes(role)) {
          return false;
        }
        return true;
      });

      return {
        ...group,
        items: filteredItems,
      };
    }

    return group;
  });
}
