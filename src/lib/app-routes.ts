// Routes that belong to the signed-in app. The marketing chrome (landing navbar, MENU button, public support chat)
// must not render on top of these pages.
const APP_PREFIXES = ["/dashboard", "/team", "/paths", "/tasks", "/projects", "/audit", "/learn", "/people", "/reports", "/slides", "/connect-github", "/invite"];

export const isAppRoute = (pathname: string | null | undefined) =>
  !!pathname && APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
