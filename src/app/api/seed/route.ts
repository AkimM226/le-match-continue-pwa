import { NextResponse } from "next/server";
import { db } from "@/db";
import { benevoles, matchConfig } from "@/db/schema";
import { newId } from "@/lib/uuid";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    // Seed config match par défaut
    const existing = await db
      .select()
      .from(matchConfig)
      .where(eq(matchConfig.id, 1));

    if (existing.length === 0) {
      await db.insert(matchConfig).values({
        id: 1,
        scoreBonusGarcons: 0,
        scoreBonusFilles: 0,
        objectifGlobal: 50,
      });
    }

    // Seed bénévoles par défaut
    const existingBenevoles = await db.select().from(benevoles);
    if (existingBenevoles.length === 0) {
      await db.insert(benevoles).values([
        {
          id: newId(),
          prenom: "Kofi",
          pin: "1234",
          role: "organisateur",
        },
        {
          id: newId(),
          prenom: "Aminata",
          pin: "2345",
          role: "benevole",
        },
        {
          id: newId(),
          prenom: "Seydou",
          pin: "3456",
          role: "benevole",
        },
        {
          id: newId(),
          prenom: "Mariam",
          pin: "4567",
          role: "benevole",
        },
      ]);
    }

    return NextResponse.json({ success: true, message: "Données initialisées" });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
