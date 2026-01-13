import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Retorna YYYY-MM-DD para "hoje" no timezone IANA informado.
 */
function todayInTimezone(tz: string) {
  // en-CA formata como YYYY-MM-DD
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

  // 1) Descobre o papel (coach/admin podem excluir qualquer registro permitido pelas políticas/RPC)
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profErr) {
    return NextResponse.json(
      { error: "Falha ao ler perfil.", details: profErr.message },
      { status: 500 }
    );
  }

  const role = profile?.role ?? null;
  const isCoachOrAdmin = role === "coach" || role === "admin";

  // 2) Se NÃO for coach/admin, então é atleta: só pode deletar o check-in de HOJE (dia local)
  if (!isCoachOrAdmin) {
    // 2.1) Carrega o atleta do usuário (pelo owner_id, e fallback pelo id)
    const { data: athleteByOwner } = await supabase
      .from("athletes")
      .select("id, owner_id, timezone")
      .eq("owner_id", userId)
      .maybeSingle();

    const { data: athleteById } = athleteByOwner
      ? { data: null as any }
      : await supabase
          .from("athletes")
          .select("id, owner_id, timezone")
          .eq("id", userId)
          .maybeSingle();

    const athlete = athleteByOwner ?? athleteById;

    if (!athlete) {
      return NextResponse.json(
        { error: "Atleta não encontrado para o usuário logado." },
        { status: 403 }
      );
    }

    if (!athlete.timezone) {
      return NextResponse.json(
        { error: "Timezone do atleta não definido. Complete o perfil antes." },
        { status: 400 }
      );
    }

    // 2.2) Busca o check-in para validar se é do próprio atleta e de HOJE
    const { data: checkin, error: chkErr } = await supabase
      .from("checkins_bem_estar")
      .select("id, athlete_id, data_local")
      .eq("id", id)
      .maybeSingle();

    if (chkErr) {
      return NextResponse.json(
        { error: "Falha ao ler check-in.", details: chkErr.message },
        { status: 500 }
      );
    }

    if (!checkin) {
      return NextResponse.json({ error: "Check-in não encontrado." }, { status: 404 });
    }

    if (checkin.athlete_id !== athlete.id) {
      return NextResponse.json(
        { error: "Sem permissão para excluir este check-in." },
        { status: 403 }
      );
    }

    const hojeLocal = todayInTimezone(athlete.timezone);
    if (checkin.data_local !== hojeLocal) {
      return NextResponse.json(
        {
          error: "Você só pode excluir o check-in do dia de hoje (no seu fuso horário).",
          details: { hojeLocal, dataLocalDoRegistro: checkin.data_local, timezone: athlete.timezone },
        },
        { status: 403 }
      );
    }
  }

  // 3) Passou nas validações -> executa delete físico via RPC (e audit no banco)
  const { error } = await supabase.rpc("delete_checkin_bem_estar", {
    p_checkin_id: id,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message, code: (error as any).code ?? null },
      { status: 400 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
