import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnvStatus, logSupabaseConfigurationError } from "@/lib/env";

const protectedPaths = ["/overview", "/profile", "/attendance", "/leave", "/payroll", "/documents", "/notifications", "/settings", "/hr", "/admin", "/employees", "/reports", "/announcements", "/activity", "/departments"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const environment = getSupabaseEnvStatus();
  if (!environment.configured) {
    logSupabaseConfigurationError("proxy");
    return response;
  }

  const supabase = createServerClient(environment.env.url, environment.env.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`));
  if (!user && isProtected) {
    const login = request.nextUrl.clone(); login.pathname = "/login"; login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
