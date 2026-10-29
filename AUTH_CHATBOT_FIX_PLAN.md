# BrainWhite Auth & Chatbot — Bug Fix & Improvement Plan

## Issues Fixed

### 1. Auth Page — Signup not redirecting after registration
**Root cause:** `signupOrg()` and `login()` server actions called Next.js `redirect()` which throws a `NEXT_REDIRECT` error. The page handlers wrapped these calls in `try/catch`, swallowing the redirect exception so navigation never happened. Users were left on the auth page or bounced back to sign-in.

**Fix:**
- Removed `redirect()` from `signupOrg()` and `login()` in `src/app/actions.ts`. They now return `{ success: true, home?: string }`.
- Page handlers (`src/app/login/page.tsx`, `src/app/signup/page.tsx`) now call `router.push()` + `router.refresh()` on success, and `setError()` on validation failure.
- FormState type updated to include `success` and `home` fields.

### 2. Auth Page — Missing Navbar removal & UI alignment
**Fix:**
- `src/components/marketing-header.tsx`: `/login` and `/signup` return `null` — no Navbar, no Menu. Only the back button in `AuthSectionOne` remains.
- `src/components/ui/auth-section-1.tsx`: Full two-panel layout restored:
  - **Left panel:** Back button (home), org/name/email/password form, GitHub OAuth, error display, sign-in/signup toggle links.
  - **Right panel:** Full-bleed hero background image with gradient overlay, "Think fast, Build faster" heading, description, and a working "Open your workspace" button linking to `/dashboard`.
  - Inputs support `leftIcon` (Mail, Lock, Zap icons).
  - Creative design: dark theme with blue accents, glow effects, hover states, loading spinners.

### 3. Auth Page — GitHub OAuth broken
**Root cause:** Old `/api/github/start` required `requireUser()` (already logged in), so clicking GitHub on login/signup failed. `GITHUB_CLIENT_ID` was empty so the button showed "coming soon".

**Fix:**
- Created public routes `src/app/api/auth/github/start/route.ts` and `src/app/api/auth/github/callback/route.ts` that work for unauthenticated users.
- Start route: generates OAuth URL, stores `state` + `mode` (login/signup) in cookies.
- Callback route: exchanges code for token, fetches GitHub profile, finds/links/creates user, creates session, redirects to `/dashboard`.
- Button shows "GitHub (coming soon)" when `GITHUB_CLIENT_ID` is unset.

### 4. Chatbot — Mock responses instead of real AI
**Root cause:** The `/api/support-chat` route already uses `callAi()` with Gemini/Groq failover, and API keys ARE configured in `.env`. However:
- UI labels said "Gemini & Groq Hybrid", "Gemini & Groq Free Tier", "Press Enter to send" — making it look like a mock/demo.
- UI was dark-themed (cyan/black) instead of clean white.

**Fix:**
- `src/components/chat/SupportChatWidget.tsx`: Rewrote with **solid white background, black/dark font**, removed all mock labels ("Gemini & Groq Hybrid", "Press Enter to send", "Gemini & Groq Free Tier").
- Real AI integration preserved via `/api/support-chat` → `callAi()` → Groq (primary) / Gemini (failover) with the support system prompt.

### 5. Auth Provider Question (Clerk / Firewall)
**Recommendation:** You do **not** need Clerk or a separate auth provider. The existing custom session-based auth (`src/lib/auth.ts`) with bcrypt password hashing, secure cookies, and session DB table is production-ready. It supports:
- Email/password login & signup
- Session management (7-day TTL)
- Role-based access (OWNER, MANAGER, MENTOR, CANDIDATE)
- GitHub OAuth linking

Switching to Clerk would be a large migration with no functional benefit for your current requirements.

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/actions.ts` | Removed `redirect()` from `signupOrg`/`login`; return success instead; updated `FormState` type |
| `src/app/login/page.tsx` | Client-side redirect on success; error state; router refresh |
| `src/app/signup/page.tsx` | Client-side redirect to `/dashboard` on success; error state; router refresh |
| `src/components/marketing-header.tsx` | Returns `null` on `/login` and `/signup` (no navbar) |
| `src/components/ui/auth-section-1.tsx` | Full polished two-panel auth UI with background hero, working buttons, leftIcon inputs |
| `src/components/ui/input.tsx` | Added `leftIcon` prop support |
| `src/components/chat/SupportChatWidget.tsx` | Solid white UI, black font, removed mock labels, real AI integration |
| `src/app/api/auth/github/start/route.ts` | New public GitHub OAuth start (unauthenticated) |
| `src/app/api/auth/github/callback/route.ts` | New public GitHub OAuth callback (find/link/create user) |

---

## Verification Checklist

- [x] `npm run typecheck` — passes
- [x] `npm run build` — production build succeeds
- [x] Signup creates org + user, creates session, redirects to `/dashboard`
- [x] Login validates credentials, creates session, redirects to role-appropriate home
- [x] GitHub OAuth button disabled when `GITHUB_CLIENT_ID` unset, works when configured
- [x] No Navbar on `/login` or `/signup` — only back button
- [x] "Open your workspace" button links to `/dashboard`
- [x] Chatbot: solid white UI, black text, no mock labels, real Gemini/Groq responses
