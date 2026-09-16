import { NextResponse, type NextRequest } from "next/server";

// Garde de session « léger » : simple présence du cookie (la vérification
// réelle de la session se fait côté serveur dans le layout /admin et la page
// de connexion — jamais ici, sinon un cookie périmé bouclerait entre les deux).
// NB : sur HTTPS better-auth préfixe le cookie avec « __Secure- » (prod) ;
// en local HTTP il reste nu. Accepter les deux, sinon boucle de redirection
// entre /admin (proxy) et /admin/login (session valide côté page).
const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

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
  const hasSession = SESSION_COOKIES.some((name) =>
    request.cookies.has(name),
  );

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
