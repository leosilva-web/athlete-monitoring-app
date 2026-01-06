import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server client (Server Components / Route Handlers)
 * Next 16: APIs dinâmicas como cookies() podem ser async.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return cookieStore.getAll();
        },
        async setAll(_cookiesToSet) {
          // No Server Component geralmente não dá pra setar cookie aqui.
          // Quem mantém sessão/cookies atualizado é o proxy/middleware (updateSession).
        },
      },
    }
  );
}
