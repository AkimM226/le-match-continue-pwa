import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { promesses, participants, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { newId } from "@/lib/uuid";

// GET: liste des promesses en litige
export async function GET() {
  try {
    const litiges = await db
      .select()
      .from(promesses)
      .where(eq(promesses.statut, "en_litige"));

    const result = await Promise.all(
      litiges.map(async (l) => {
        const recruteur = await db
          .select({ nom: participants.nom, genre: participants.genre })
          .from(participants)
          .where(eq(participants.id, l.recruteurId));
        return { ...l, recruteur: recruteur[0] ?? null };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PUT: résoudre un litige (accepter ou rejeter)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { promesseId, decision, benevoleId } = body;
    // decision: 'valider' | 'rejeter'

    if (!promesseId || !decision) {
      return NextResponse.json(
        { error: "promesseId et decision requis" },
        { status: 400 }
      );
    }

    const newStatut = decision === "valider" ? "presente" : "en_attente";

    await db
      .update(promesses)
      .set({
        statut: newStatut,
        ...(decision === "valider" ? { timestampPointage: new Date() } : {}),
      })
      .where(eq(promesses.id, promesseId));

    await db.insert(auditLog).values({
      id: newId(),
      benevoleId: benevoleId ?? null,
      action: `LITIGE_${decision.toUpperCase()}`,
      entityType: "promesse",
      entityId: promesseId,
      details: JSON.stringify({ decision }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
