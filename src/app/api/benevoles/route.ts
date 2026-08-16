import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { benevoles } from "@/db/schema";
import { newId } from "@/lib/uuid";

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
