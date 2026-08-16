import { NextResponse } from "next/server";
import { db } from "@/db";
import { participants, promesses, donneursSpontanes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    // Recruteurs + promesses
    const allParticipants = await db.select().from(participants);
    const allPromesses = await db.select().from(promesses);
    const allSpontanes = await db.select().from(donneursSpontanes);

    const lines: string[] = [];

    // En-tête CSV
    lines.push(
      [
        "Type",
        "Nom",
        "Téléphone",
        "Équipe",
        "Rôle",
        "Recruteur",
        "Statut",
        "Date enregistrement",
        "Date pointage",
      ].join(";")
    );

    // Recruteurs
    for (const p of allParticipants) {
      lines.push(
        [
          "Recruteur",
          p.nom,
          p.telephone,
          p.genre === "M" ? "Garçons" : "Filles",
          p.roleParticipant,
          "",
          "actif",
          p.createdAt.toISOString(),
          "",
        ].join(";")
      );
    }

    // Promesses
    for (const prom of allPromesses) {
      const recruteur = allParticipants.find((p) => p.id === prom.recruteurId);
      lines.push(
        [
          "Promesse",
          prom.nomPersonnePromise,
          prom.telephonePersonnePromise,
          recruteur?.genre === "M" ? "Garçons" : "Filles",
          "",
          recruteur?.nom ?? "",
          prom.statut,
          prom.timestampEnregistrement.toISOString(),
          prom.timestampPointage?.toISOString() ?? "",
        ].join(";")
      );
    }

    // Spontanés
    for (const s of allSpontanes) {
      lines.push(
        [
          "Donneur spontané",
          s.nom,
          s.telephone,
          "—",
          "",
          "",
          "presente",
          s.timestampPointage.toISOString(),
          s.timestampPointage.toISOString(),
        ].join(";")
      );
    }

    const csv = lines.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="le-match-continue-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
