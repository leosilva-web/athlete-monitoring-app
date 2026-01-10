export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

type Body = {
  targetRole: "coach" | "athlete";
  expiresInDays?: number;
};

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function randomTokenHex(bytes = 24) {
  return crypto.randomBytes(bytes).toString("hex");
}

export async function POST(req: Request) {
  const supabase = await createClient(); // 👈 IMPORTANTE (o seu createClient é async)

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido (JSON)." }, { status: 400 });
  }

  const targetRole = body.targetRole;
  const expiresInDays = body.expiresInDays ?? 7;

  if (targetRole !== "coach" && targetRole !== "athlete") {
    return NextResponse.json({ error: "targetRole inválido." }, { status: 400 });
  }

  const [{ data: isAdmin, error: adminErr }, { data: isCoach, error: coachErr }] =
    await Promise.all([supabase.rpc("is_admin"), supabase.rpc("is_coach")]);

  if (adminErr || coachErr) {
    return NextResponse.json(
      { error: "Falha ao checar permissões (is_admin/is_coach)." },
      { status: 500 }
    );
  }

  const allowed =
    (targetRole === "coach" && isAdmin === true) ||
    (targetRole === "athlete" && isCoach === true);

  if (!allowed) {
    return NextResponse.json(
      { error: "Sem permissão para criar este tipo de convite." },
      { status: 403 }
    );
  }

  const token = randomTokenHex(24);
  const token_hash = sha256Hex(token);
  const expires_at = new Date(Date.now() + expiresInDays * 86400000).toISOString();

  const payload = {
    token_hash,
    role: targetRole,
    created_by: user.id,
    coach_id: targetRole === "athlete" ? user.id : null,
    expires_at,
  };

  const { data, error } = await supabase
    .from("invites")
    .insert(payload)
    .select("id, role, coach_id, expires_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Falha ao criar convite.", details: error.message },
      { status: 400 }
    );
  }

  const origin =
    req.headers.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  const inviteUrl = `${origin}/cadastro?token=${token}`;

  return NextResponse.json({ invite: data, inviteUrl });
}
