import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { benevoles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    if (!pin) {
      return NextResponse.json({ error: "PIN requis" }, { status: 400 });
    }

    const result = await db
      .select()
      .from(benevoles)
      .where(eq(benevoles.pin, String(pin)));

    if (result.length === 0) {
      return NextResponse.json({ error: "PIN incorrect" }, { status: 401 });
    }

    const benevole = result[0];
    return NextResponse.json({
      id: benevole.id,
      prenom: benevole.prenom,
      role: benevole.role,
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
