import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { participants, promesses, auditLog } from "@/db/schema";
import { eq, ilike, or } from "drizzle-orm";
import { normalizePhone } from "@/lib/phone";
import { newId } from "@/lib/uuid";

// GET: liste des recruteurs avec leurs promesses
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";

    let rows;
    if (search) {
      const normalized = normalizePhone(search);
      rows = await db
        .select()
        .from(participants)
        .where(
          or(
            ilike(participants.nom, `%${search}%`),
            eq(participants.telephone, normalized)
          )
        )
        .limit(50);
    } else {
      rows = await db.select().from(participants).limit(100);
    }

    // Joindre les promesses
    const result = await Promise.all(
      rows.map(async (p) => {
        const prom = await db
          .select()
          .from(promesses)
          .where(eq(promesses.recruteurId, p.id));
        return { ...p, promesses: prom };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET participants error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST: créer un recruteur avec ses promesses
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nom, telephone, genre, roleParticipant, promessesData, benevoleId } = body;

    if (!nom || !telephone || !genre) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    const telNorm = normalizePhone(telephone);

    // Vérifier doublon recruteur
    const existing = await db
      .select()
      .from(participants)
      .where(eq(participants.telephone, telNorm));

    if (existing.length > 0) {
      return NextResponse.json(
        {
          error: "doublon_recruteur",
          message: `Ce numéro est déjà enregistré comme recruteur (${existing[0].nom})`,
          existing: existing[0],
        },
        { status: 409 }
      );
    }

    // Créer le recruteur
    const participantId = newId();
    await db.insert(participants).values({
      id: participantId,
      nom: nom.trim(),
      telephone: telNorm,
      genre: genre as "M" | "F",
      roleParticipant: (roleParticipant ?? "spectateur") as "joueur" | "spectateur",
      saisiParBenevoleId: benevoleId ?? null,
    });

    // Traiter les promesses
    const promessesCreees = [];
    const promessesEchecs = [];

    if (Array.isArray(promessesData)) {
      for (const p of promessesData) {
        const telP = normalizePhone(p.telephone);
        if (!telP || !p.nom) continue;

        // Vérifier doublon promesse
        const existingProm = await db
          .select({ id: promesses.id, recruteurId: promesses.recruteurId, nom: promesses.nomPersonnePromise })
          .from(promesses)
          .where(eq(promesses.telephonePersonnePromise, telP));

        if (existingProm.length > 0) {
          // Chercher le recruteur existant
          const recruteurExist = await db
            .select({ nom: participants.nom })
            .from(participants)
            .where(eq(participants.id, existingProm[0].recruteurId));

          promessesEchecs.push({
            nom: p.nom,
            telephone: telP,
            raison: `Déjà promis par ${recruteurExist[0]?.nom ?? "un autre recruteur"}`,
          });
          continue;
        }

        const promId = newId();
        await db.insert(promesses).values({
          id: promId,
          recruteurId: participantId,
          nomPersonnePromise: p.nom.trim(),
          telephonePersonnePromise: telP,
          statut: "en_attente",
          saisiParBenevoleId: benevoleId ?? null,
          timestampEnregistrement: new Date(),
        });
        promessesCreees.push({ id: promId, nom: p.nom, telephone: telP });
      }
    }

    // Audit log
    await db.insert(auditLog).values({
      id: newId(),
      benevoleId: benevoleId ?? null,
      action: "CREATE_RECRUTEUR",
      entityType: "participant",
      entityId: participantId,
      details: JSON.stringify({ nom, telephone: telNorm, genre }),
    });

    return NextResponse.json({
      success: true,
      participant: { id: participantId, nom, telephone: telNorm, genre },
      promessesCreees,
      promessesEchecs,
    });
  } catch (error) {
    console.error("POST participants error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
