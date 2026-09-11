import { NextResponse } from "next/server";
import { getSchema } from "@/lib/notion";
import { editableSchema } from "@/lib/props";

export const runtime = "nodejs";

const slots = ["daily", "monthly", "analysis"] as const;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const slot = url.searchParams.get("slot") as (typeof slots)[number] | null;
    const requestedId = url.searchParams.get("id") || undefined;
    if (!slot || !slots.includes(slot)) {
      return NextResponse.json({ error: "Invalid slot." }, { status: 400 });
    }
    const data = await getSchema(slot, requestedId);
    return NextResponse.json({
      id: data.id,
      title: data.title?.[0]?.plain_text || data.title?.[0]?.text?.content || slot,
      properties: editableSchema(data.properties || {}),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Schema load failed." }, { status: 500 });
  }
}
