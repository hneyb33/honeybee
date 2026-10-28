import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type AuthenticatedRequestResult =
  | { client: SupabaseClient; userId: string }
  | { error: string; status: number };

export async function getAuthenticatedRequestClient(
  request: Request
): Promise<AuthenticatedRequestResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return { error: "Authentication is not configured.", status: 503 };
  }

  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return { error: "Sign in to continue.", status: 401 };
  }

  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    return { error: "Your session is invalid or expired.", status: 401 };
  }

  return { client, userId: data.user.id };
}
