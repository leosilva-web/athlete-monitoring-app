export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Body = {
  token: string;
};

export async function POST(req: Request) {
  const supabase = await createClient();

  // precisa estar autenticado (o usuário vai consumir após signup/login)
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

  const token = body.token?.trim();
  if (!token) {
    return NextResponse.json({ error: "Token ausente." }, { status: 400 });
  }

  // chama a função atômica do banco (uso único + expiração)
  const { data, error } = await supabase.rpc("consume_invite", { p_token: token });

  if (error) {
    return NextResponse.json(
      { error: "Falha ao consumir convite.", details: error.message },
      { status: 400 }
    );
  }

  // Quando não encontra / expirou / já usado -> vem vazio
  const consumed = Array.isArray(data) ? data[0] : data;
  if (!consumed) {
    return NextResponse.json(
      { error: "Convite inválido, expirado ou já utilizado." },
      { status: 400 }
    );
  }

  return NextResponse.json({ consumed });
}
