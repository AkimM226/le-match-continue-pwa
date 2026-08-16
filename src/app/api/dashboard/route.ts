import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  participants,
  promesses,
  donneursSpontanes,
  matchConfig,
} from "@/db/schema";
import { eq, count, sql } from "drizzle-orm";

export async function GET() {
  try {
    // Config
    const configRows = await db.select().from(matchConfig).where(eq(matchConfig.id, 1));
    const config = configRows[0] ?? {
      scoreBonusGarcons: 0,
      scoreBonusFilles: 0,
      objectifGlobal: 50,
    };

    // Promesses par équipe et statut
    const promessesStats = await db
      .select({
        genre: participants.genre,
        statut: promesses.statut,
        nb: count(promesses.id),
      })
      .from(promesses)
      .innerJoin(participants, eq(promesses.recruteurId, participants.id))
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

    // Recruteurs
    const recruteursRows = await db
      .select({ genre: participants.genre, nb: count(participants.id) })
      .from(participants)
      .groupBy(participants.genre);

    let recruteursGarcons = 0;
    let recruteursFilles = 0;
    for (const r of recruteursRows) {
      if (r.genre === "M") recruteursGarcons = Number(r.nb);
      else recruteursFilles = Number(r.nb);
    }

    const totalPresents =
      garcons_presente + filles_presente + spontanes;

    const scoreGarcons = config.scoreBonusGarcons + garcons_presente;
    const scoreFilles = config.scoreBonusFilles + filles_presente;

    return NextResponse.json({
      config,
      garcons: {
        recruteurs: recruteursGarcons,
        promesses_total: garcons_en_attente + garcons_presente + garcons_en_litige,
        en_attente: garcons_en_attente,
        presente: garcons_presente,
        en_litige: garcons_en_litige,
        score: scoreGarcons,
      },
      filles: {
        recruteurs: recruteursFilles,
        promesses_total: filles_en_attente + filles_presente + filles_en_litige,
        en_attente: filles_en_attente,
        presente: filles_presente,
        en_litige: filles_en_litige,
        score: scoreFilles,
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
