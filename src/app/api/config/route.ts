import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { matchConfig, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { newId } from "@/lib/uuid";

export async function GET() {
  try {
    const rows = await db.select().from(matchConfig).where(eq(matchConfig.id, 1));
    if (rows.length === 0) {
      return NextResponse.json({
        id: 1,
        scoreBonusGarcons: 0,
        scoreBonusFilles: 0,
        objectifGlobal: 50,
      });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { scoreBonusGarcons, scoreBonusFilles, objectifGlobal, benevoleId } = body;

    const existing = await db.select().from(matchConfig).where(eq(matchConfig.id, 1));

    if (existing.length === 0) {
      await db.insert(matchConfig).values({
        id: 1,
        scoreBonusGarcons: scoreBonusGarcons ?? 0,
        scoreBonusFilles: scoreBonusFilles ?? 0,
        objectifGlobal: objectifGlobal ?? 50,
      });
    } else {
      await db
        .update(matchConfig)
        .set({
          scoreBonusGarcons: scoreBonusGarcons ?? existing[0].scoreBonusGarcons,
          scoreBonusFilles: scoreBonusFilles ?? existing[0].scoreBonusFilles,
          objectifGlobal: objectifGlobal ?? existing[0].objectifGlobal,
          updatedAt: new Date(),
        })
        .where(eq(matchConfig.id, 1));
    }

    await db.insert(auditLog).values({
      id: newId(),
      benevoleId: benevoleId ?? null,
      action: "UPDATE_CONFIG",
      entityType: "match_config",
      entityId: "1",
      details: JSON.stringify({ scoreBonusGarcons, scoreBonusFilles, objectifGlobal }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
