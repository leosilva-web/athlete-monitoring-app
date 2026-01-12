import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function yyyyMmDdFromTimeZone(tz: string) {
  // Produz YYYY-MM-DD no fuso IANA informado
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dtf.format(new Date()); // en-CA => 2026-01-12
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // id do checkin

  const supabase = await createClient();

  // 1) Auth
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const actorUserId = auth.user.id;

  // 2) Perfil (role)
  const { data: prof, error: profErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", actorUserId)
    .single();

  if (profErr) {
    return NextResponse.json(
      { error: "profile_read_failed", details: profErr.message },
      { status: 500 }
    );
  }

  const role = (prof?.role ?? "athlete") as "athlete" | "coach" | "admin";

  // 3) Buscar o check-in alvo (para checar permissões)
  const { data: checkin, error: cErr } = await supabase
    .from("checkins_bem_estar")
    .select("id, athlete_id, data_local")
    .eq("id", id)
    .single();

  if (cErr || !checkin) {
    return NextResponse.json(
      { error: "checkin_not_found", details: cErr?.message ?? null },
      { status: 404 }
    );
  }

  // 4) Regras de permissão
  if (role === "athlete") {
    // atleta só pode deletar o check-in do "HOJE" (dia local do atleta),
    // e só do próprio atleta (athletes.owner_id = auth.uid()).
    const { data: athlete, error: aErr } = await supabase
      .from("athletes")
      .select("id, timezone")
      .eq("owner_id", actorUserId)
      .single();

    if (aErr || !athlete) {
      return NextResponse.json(
        { error: "athlete_not_found_for_user", details: aErr?.message ?? null },
        { status: 403 }
      );
    }

    // checkin tem que ser do atleta logado
    if (checkin.athlete_id !== athlete.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // checkin tem que ser do "hoje" no fuso do atleta
    const todayLocal = yyyyMmDdFromTimeZone(athlete.timezone);
    if (checkin.data_local !== todayLocal) {
      return NextResponse.json(
        { error: "athlete_can_only_delete_today", todayLocal, data_local: checkin.data_local },
        { status: 403 }
      );
    }
  }

  if (role === "coach") {
    // coach só pode deletar check-in de atleta vinculado a ele
    const { data: link, error: linkErr } = await supabase
      .from("coach_athletes")
      .select("coach_id, athlete_id")
      .eq("coach_id", actorUserId)
      .eq("athlete_id", checkin.athlete_id)
      .maybeSingle();

    if (linkErr || !link) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  // admin: libera geral

  // 5) Delete físico
  const { error: dErr } = await supabase
    .from("checkins_bem_estar")
    .delete()
    .eq("id", id);

  if (dErr) {
    return NextResponse.json(
      { error: "delete_failed", details: dErr.message },
      { status: 500 }
    );
  }

  // 6) Audit log mínimo (sempre)
  const { error: logErr } = await supabase.from("audit_events").insert({
    actor_user_id: actorUserId,
    actor_role: role,
    action: "DELETE",
    entity: "checkins_bem_estar",
    entity_id: id,
    athlete_id: checkin.athlete_id,
    metadata: {
      reason: role === "athlete" ? "athlete_delete_today_only" : "coach_or_admin_delete",
      data_local: checkin.data_local,
    },
  });

  if (logErr) {
    // Não falha o delete por causa do log, mas retorna aviso
    return NextResponse.json(
      { ok: true, warning: "deleted_but_audit_failed", audit_error: logErr.message },
      { status: 200 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
