import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  promesses,
  participants,
  donneursSpontanes,
  auditLog,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { normalizePhone } from "@/lib/phone";
import { newId } from "@/lib/uuid";

// GET: rechercher par téléphone (pointage J2)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tel = searchParams.get("telephone") ?? "";
    const telNorm = normalizePhone(tel);

    if (!telNorm) {
      return NextResponse.json({ error: "Téléphone requis" }, { status: 400 });
    }

    // Chercher dans les promesses
    const promResult = await db
      .select()
      .from(promesses)
      .where(eq(promesses.telephonePersonnePromise, telNorm));

    if (promResult.length > 0) {
      const prom = promResult[0];
      // Chercher le recruteur
      const recruteurResult = await db
        .select()
        .from(participants)
        .where(eq(participants.id, prom.recruteurId));

      const recruteur = recruteurResult[0];

      return NextResponse.json({
        type: "promesse",
        promesse: prom,
        recruteur: recruteur
          ? {
              id: recruteur.id,
              nom: recruteur.nom,
              genre: recruteur.genre,
              telephone: recruteur.telephone,
            }
          : null,
      });
    }

    // Chercher dans les recruteurs (participants)
    const participantResult = await db
      .select()
      .from(participants)
      .where(eq(participants.telephone, telNorm));

    if (participantResult.length > 0) {
      return NextResponse.json({
        type: "recruteur",
        recruteur: participantResult[0],
      });
    }

    // Chercher dans les donneurs spontanés
    const spontaneResult = await db
      .select()
      .from(donneursSpontanes)
      .where(eq(donneursSpontanes.telephone, telNorm));

    if (spontaneResult.length > 0) {
      return NextResponse.json({
        type: "spontane_deja_enregistre",
        spontane: spontaneResult[0],
      });
    }

    return NextResponse.json({ type: "non_trouve", telephone: telNorm });
  } catch (error) {
    console.error("GET pointage error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST: valider présence ou enregistrer donneur spontané
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, telephone, nom, promesseId, benevoleId } = body;
    const telNorm = normalizePhone(telephone ?? "");

    if (action === "valider_presence") {
      if (!promesseId) {
        return NextResponse.json(
          { error: "promesseId requis" },
          { status: 400 }
        );
      }

      const existing = await db
        .select()
        .from(promesses)
        .where(eq(promesses.id, promesseId));

      if (existing.length === 0) {
        return NextResponse.json(
          { error: "Promesse introuvable" },
          { status: 404 }
        );
      }

      if (existing[0].statut === "presente") {
        return NextResponse.json(
          {
            error: "deja_pointe",
            message: `Personne déjà pointée à ${existing[0].timestampPointage?.toISOString()}`,
            timestampPointage: existing[0].timestampPointage,
          },
          { status: 409 }
        );
      }

      await db
        .update(promesses)
        .set({
          statut: "presente",
          timestampPointage: new Date(),
          pointeParBenevoleId: benevoleId ?? null,
        })
        .where(eq(promesses.id, promesseId));

      await db.insert(auditLog).values({
        id: newId(),
        benevoleId: benevoleId ?? null,
        action: "VALIDER_PRESENCE",
        entityType: "promesse",
        entityId: promesseId,
        details: JSON.stringify({ telephone: telNorm }),
      });

      return NextResponse.json({ success: true, action: "presence_validee" });
    }

    if (action === "valider_presence_recruteur") {
      const { participantId } = body;
      if (!participantId) {
        return NextResponse.json(
          { error: "participantId requis" },
          { status: 400 }
        );
      }

      const existingPart = await db
        .select()
        .from(participants)
        .where(eq(participants.id, participantId));

      if (existingPart.length === 0) {
        return NextResponse.json(
          { error: "Recruteur introuvable" },
          { status: 404 }
        );
      }

      if (existingPart[0].timestampPointage) {
        return NextResponse.json(
          {
            error: "deja_pointe",
            message: `Recruteur déjà pointé à ${existingPart[0].timestampPointage.toISOString()}`,
            timestampPointage: existingPart[0].timestampPointage,
          },
          { status: 409 }
        );
      }

      await db
        .update(participants)
        .set({
          timestampPointage: new Date(),
          pointeParBenevoleId: benevoleId ?? null,
        })
        .where(eq(participants.id, participantId));

      await db.insert(auditLog).values({
        id: newId(),
        benevoleId: benevoleId ?? null,
        action: "VALIDER_PRESENCE_RECRUTEUR",
        entityType: "participant",
        entityId: participantId,
        details: JSON.stringify({ telephone: telNorm }),
      });

      return NextResponse.json({
        success: true,
        action: "presence_recruteur_validee",
      });
    }

    if (action === "enregistrer_spontane") {
      if (!telNorm || !nom) {
        return NextResponse.json(
          { error: "Téléphone et nom requis" },
          { status: 400 }
        );
      }

      // Vérifier doublon
      const existingSpont = await db
        .select()
        .from(donneursSpontanes)
        .where(eq(donneursSpontanes.telephone, telNorm));

      if (existingSpont.length > 0) {
        return NextResponse.json(
          {
            error: "deja_enregistre",
            message: "Ce donneur spontané est déjà enregistré",
          },
          { status: 409 }
        );
      }

      const spontId = newId();
      await db.insert(donneursSpontanes).values({
        id: spontId,
        nom: nom.trim(),
        telephone: telNorm,
        pointeParBenevoleId: benevoleId ?? null,
        timestampPointage: new Date(),
      });

      await db.insert(auditLog).values({
        id: newId(),
        benevoleId: benevoleId ?? null,
        action: "ENREGISTRER_SPONTANE",
        entityType: "donneur_spontane",
        entityId: spontId,
        details: JSON.stringify({ nom, telephone: telNorm }),
      });

      return NextResponse.json({ success: true, action: "spontane_enregistre" });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (error) {
    console.error("POST pointage error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
