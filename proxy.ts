import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Sadece login gerektiren yollarda çalışır — diğer her yerde middleware atlanır.
// Halka açık sayfalar (/, /urunler, /urun/..., /giris, /kayit, /api/*) Supabase Auth
// ağ çağrısı yapmadan render olur.
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/giris";
      url.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  } catch {
    // Auth hatası sayfayı kırmasın — session olmadan devam et
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/hesabim",
    "/hesabim/:path*",
    "/sepet",
    "/sepet/:path*",
    "/odeme",
    "/odeme/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
