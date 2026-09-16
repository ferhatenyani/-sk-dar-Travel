import { NextResponse, type NextRequest } from "next/server";

// Garde de session « léger » : simple présence du cookie (la vérification
// réelle de la session se fait côté serveur dans le layout /admin et la page
// de connexion — jamais ici, sinon un cookie périmé bouclerait entre les deux).
const SESSION_COOKIE = "better-auth.session_token";

// Pages admin accessibles sans session (récupération de mot de passe).
const PUBLIC_ADMIN_PATHS = [
  "/admin/login",
  "/admin/mot-de-passe-oublie",
  "/admin/reinitialiser-mot-de-passe",
];

function isPublicAdminPath(pathname: string): boolean {
  return PUBLIC_ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = isPublicAdminPath(pathname);
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (!isPublic && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
