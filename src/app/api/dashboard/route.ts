import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  participants,
  promesses,
  donneursSpontanes,
  matchConfig,
} from "@/db/schema";
import { eq, ne, and, count, isNotNull } from "drizzle-orm";

export async function GET() {
  try {
    // Config
    const configRows = await db.select().from(matchConfig).where(eq(matchConfig.id, 1));
    const config = configRows[0] ?? {
      scoreBonusGarcons: 0,
      scoreBonusFilles: 0,
      objectifGlobal: 50,
    };

    // Promesses par équipe et statut (hors staff)
    const promessesStats = await db
      .select({
        genre: participants.genre,
        statut: promesses.statut,
        nb: count(promesses.id),
      })
      .from(promesses)
      .innerJoin(participants, eq(promesses.recruteurId, participants.id))
      .where(ne(participants.roleParticipant, "staff"))
      .groupBy(participants.genre, promesses.statut);

    let garcons_en_attente = 0;
    let garcons_presente = 0;
    let garcons_en_litige = 0;
    let filles_en_attente = 0;
    let filles_presente = 0;
    let filles_en_litige = 0;

    for (const row of promessesStats) {
      const nb = Number(row.nb);
      if (row.genre === "M") {
        if (row.statut === "en_attente") garcons_en_attente = nb;
        else if (row.statut === "presente") garcons_presente = nb;
        else if (row.statut === "en_litige") garcons_en_litige = nb;
      } else {
        if (row.statut === "en_attente") filles_en_attente = nb;
        else if (row.statut === "presente") filles_presente = nb;
        else if (row.statut === "en_litige") filles_en_litige = nb;
      }
    }

    // Donneurs spontanés
    const spontanesRows = await db
      .select({ nb: count(donneursSpontanes.id) })
      .from(donneursSpontanes);
    const spontanes = Number(spontanesRows[0]?.nb ?? 0);

    // Promesses du staff par statut
    const staffPromessesStats = await db
      .select({
        statut: promesses.statut,
        nb: count(promesses.id),
      })
      .from(promesses)
      .innerJoin(participants, eq(promesses.recruteurId, participants.id))
      .where(eq(participants.roleParticipant, "staff"))
      .groupBy(promesses.statut);

    let staff_en_attente = 0;
    let staff_presente = 0;
    let staff_en_litige = 0;
    for (const row of staffPromessesStats) {
      const nb = Number(row.nb);
      if (row.statut === "en_attente") staff_en_attente = nb;
      else if (row.statut === "presente") staff_presente = nb;
      else if (row.statut === "en_litige") staff_en_litige = nb;
    }

    // Recruteurs présents (pointés J2, hors staff)
    const recruteursPresentsRows = await db
      .select({ genre: participants.genre, nb: count(participants.id) })
      .from(participants)
      .where(
        and(
          isNotNull(participants.timestampPointage),
          ne(participants.roleParticipant, "staff")
        )
      )
      .groupBy(participants.genre);

    let recruteursPresentsGarcons = 0;
    let recruteursPresentsFilles = 0;
    for (const r of recruteursPresentsRows) {
      if (r.genre === "M") recruteursPresentsGarcons = Number(r.nb);
      else recruteursPresentsFilles = Number(r.nb);
    }

    // Membres du staff présents (pointés J2)
    const staffPresentsRows = await db
      .select({ nb: count(participants.id) })
      .from(participants)
      .where(
        and(
          isNotNull(participants.timestampPointage),
          eq(participants.roleParticipant, "staff")
        )
      );
    const staffPresents = Number(staffPresentsRows[0]?.nb ?? 0);

    // Membres du staff
    const staffRows = await db
      .select({ nb: count(participants.id) })
      .from(participants)
      .where(eq(participants.roleParticipant, "staff"));
    const staffRecruteurs = Number(staffRows[0]?.nb ?? 0);

    // Recruteurs (hors staff)
    const recruteursRows = await db
      .select({ genre: participants.genre, nb: count(participants.id) })
      .from(participants)
      .where(ne(participants.roleParticipant, "staff"))
      .groupBy(participants.genre);

    let recruteursGarcons = 0;
    let recruteursFilles = 0;
    for (const r of recruteursRows) {
      if (r.genre === "M") recruteursGarcons = Number(r.nb);
      else recruteursFilles = Number(r.nb);
    }

    const totalPresents =
      garcons_presente +
      filles_presente +
      recruteursPresentsGarcons +
      recruteursPresentsFilles +
      staff_presente +
      staffPresents +
      spontanes;

    const scoreGarcons =
      config.scoreBonusGarcons + garcons_presente + recruteursPresentsGarcons;
    const scoreFilles =
      config.scoreBonusFilles + filles_presente + recruteursPresentsFilles;

    return NextResponse.json({
      config,
      garcons: {
        recruteurs: recruteursGarcons,
        promesses_total: garcons_en_attente + garcons_presente + garcons_en_litige,
        en_attente: garcons_en_attente,
        presente: garcons_presente,
        recruteurs_presents: recruteursPresentsGarcons,
        en_litige: garcons_en_litige,
        score: scoreGarcons,
      },
      filles: {
        recruteurs: recruteursFilles,
        promesses_total: filles_en_attente + filles_presente + filles_en_litige,
        en_attente: filles_en_attente,
        presente: filles_presente,
        recruteurs_presents: recruteursPresentsFilles,
        en_litige: filles_en_litige,
        score: scoreFilles,
      },
      staff: {
        recruteurs: staffRecruteurs,
        promesses_total: staff_en_attente + staff_presente + staff_en_litige,
        en_attente: staff_en_attente,
        presente: staff_presente,
        recruteurs_presents: staffPresents,
        en_litige: staff_en_litige,
      },
      spontanes,
      totalPresents,
      objectifGlobal: config.objectifGlobal,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
