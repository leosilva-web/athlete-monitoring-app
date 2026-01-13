import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function todayInTimezone(tz: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const userId = userData.user.id;

  // Papel
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profErr) {
    return NextResponse.json({ error: "Falha ao ler perfil", details: profErr.message }, { status: 500 });
  }

  const role = profile?.role ?? null;
  const isCoachOrAdmin = role === "coach" || role === "admin";

  // Se for atleta, valida: sessão é dele e é do dia local de hoje.
  if (!isCoachOrAdmin) {
    const { data: athleteByOwner } = await supabase
      .from("athletes")
      .select("id, timezone")
      .eq("owner_id", userId)
      .maybeSingle();

    const { data: athleteById } = athleteByOwner
      ? { data: null as any }
      : await supabase.from("athletes").select("id, timezone").eq("id", userId).maybeSingle();

    const athlete = athleteByOwner ?? athleteById;

    if (!athlete) {
      return NextResponse.json({ error: "Atleta não encontrado." }, { status: 403 });
    }
    if (!athlete.timezone) {
      return NextResponse.json({ error: "Timezone não definido. Complete o perfil." }, { status: 400 });
    }

    const { data: sessao, error: sErr } = await supabase
      .from("sessoes_treino")
      .select("id, athlete_id, data_local")
      .eq("id", id)
      .maybeSingle();

    if (sErr) {
      return NextResponse.json({ error: "Falha ao ler sessão.", details: sErr.message }, { status: 500 });
    }
    if (!sessao) {
      return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });
    }
    if (sessao.athlete_id !== athlete.id) {
      return NextResponse.json({ error: "Sem permissão para excluir esta sessão." }, { status: 403 });
    }

    const hojeLocal = todayInTimezone(athlete.timezone);
    if (sessao.data_local !== hojeLocal) {
      return NextResponse.json(
        {
          error: "Você só pode excluir sessões registradas hoje (no seu fuso horário).",
          details: { hojeLocal, dataLocalDoRegistro: sessao.data_local, timezone: athlete.timezone },
        },
        { status: 403 }
      );
    }
  }

  // Deleta via RPC (físico + audit)
  const { error } = await supabase.rpc("delete_sessao_treino", { p_sessao_id: id });

  if (error) {
    return NextResponse.json({ error: error.message, code: (error as any).code ?? null }, { status: 400 });
  }

  return new NextResponse(null, { status: 204 });
}
