import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { benevoles } from "@/db/schema";
import { newId } from "@/lib/uuid";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: benevoles.id,
        prenom: benevoles.prenom,
        role: benevoles.role,
        createdAt: benevoles.createdAt,
      })
      .from(benevoles);
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prenom, pin, role } = body;
    if (!prenom || !pin) {
      return NextResponse.json(
        { error: "Prénom et PIN requis" },
        { status: 400 }
      );
    }

    const id = newId();
    await db.insert(benevoles).values({
      id,
      prenom: prenom.trim(),
      pin: String(pin),
      role: role ?? "benevole",
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, requesterId } = body;
    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    if (requesterId) {
      const requester = await db
        .select()
        .from(benevoles)
        .where(eq(benevoles.id, requesterId));
      if (requester.length === 0 || requester[0].role !== "organisateur") {
        return NextResponse.json(
          { error: "Action réservée aux organisateurs" },
          { status: 403 }
        );
      }
    }

    if (id === requesterId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte" },
        { status: 400 }
      );
    }

    const target = await db
      .select()
      .from(benevoles)
      .where(eq(benevoles.id, id));
    if (target.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    if (target[0].role === "organisateur") {
      const all = await db.select().from(benevoles);
      const nbOrganisateurs = all.filter(
        (b) => b.role === "organisateur"
      ).length;
      if (nbOrganisateurs <= 1) {
        return NextResponse.json(
          { error: "Impossible de supprimer le dernier organisateur" },
          { status: 400 }
        );
      }
    }

    await db.delete(benevoles).where(eq(benevoles.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
