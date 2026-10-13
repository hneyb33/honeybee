import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const listingSchema = z.object({
  title: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(180),
  kind: z.enum(["escort", "service"]),
  escort_tier: z.enum(["standard", "premium", "vip"]),
  category: z.string().trim().min(1).max(40),
  service_type: z.string().trim().max(80).nullable(),
  age: z.number().int().min(18).max(100).nullable(),
  gender: z.string().trim().max(40).nullable(),
  nationality: z.string().trim().max(80).nullable(),
  ethnicity: z.string().trim().max(80).nullable(),
  city: z.string().trim().min(1).max(80),
  neighborhood: z.string().trim().min(1).max(100),
  hourly_rate: z.number().int().min(0).max(999999999),
  monthly_price: z.number().int().min(0).max(999999999),
  whatsapp_code: z.string().trim().max(8),
  whatsapp_number: z.string().trim().max(32).nullable(),
  telegram: z.string().trim().max(120).nullable(),
  summary_line: z.string().trim().max(180).nullable(),
  description: z.string().trim().min(20).max(10000),
  about_me: z.string().trim().max(10000).nullable(),
  services_offered: z.array(z.string().trim().min(1).max(120)).max(50),
  languages: z.array(z.string().trim().min(1).max(80)).max(30),
  cover_image: z.string().url().nullable(),
  images: z.array(z.string().url()).max(50),
  verification_status: z.literal("pending"),
});

const requestSchema = z.object({
  email: z.string().trim().email().max(254),
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(32),
  accountKind: z.enum(["model", "specialist"]),
  listing: listingSchema,
}).superRefine((value, context) => {
  if (value.accountKind === "model" && value.listing.kind !== "escort") {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["listing", "kind"], message: "Model accounts require an escort listing." });
  }
  if (value.accountKind === "specialist" && value.listing.kind !== "service") {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["listing", "kind"], message: "Specialist accounts require a service listing." });
  }
  if (value.listing.kind === "escort" && value.listing.age === null) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["listing", "age"], message: "Model profiles must be for adults." });
  }
});

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json({ error: "Server account invitations are not configured. Set SUPABASE_SERVICE_ROLE_KEY." }, { status: 503 });
  }

  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: "Sign in as an admin to create provider accounts." }, { status: 401 });

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !userData.user) return NextResponse.json({ error: "Your admin session is invalid or expired." }, { status: 401 });

  const { data: actor, error: actorError } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (actorError) return NextResponse.json({ error: actorError.message }, { status: 500 });
  if (!actor || !["super_admin", "moderator"].includes(actor.role)) {
    return NextResponse.json({ error: "Admin access is required to create provider accounts." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid account or listing details." }, { status: 400 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const origin = new URL(request.url).origin;
  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      redirectTo: `${origin}/provider/onboarding`,
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        account_kind: parsed.data.accountKind,
      },
    }
  );
  if (inviteError || !invited.user) {
    return NextResponse.json({ error: inviteError?.message ?? "The account invitation could not be created." }, { status: 400 });
  }

  const { error: listingError } = await adminClient
    .from("listings")
    .insert({ ...parsed.data.listing, user_id: invited.user.id });
  if (listingError) {
    const { error: cleanupError } = await adminClient.auth.admin.deleteUser(invited.user.id);
    const message = cleanupError
      ? `${listingError.message} The invited auth account also could not be rolled back: ${cleanupError.message}`
      : `${listingError.message} The invitation was rolled back.`;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ userId: invited.user.id }, { status: 201 });
}
