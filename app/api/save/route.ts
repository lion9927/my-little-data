import { NextResponse } from "next/server";
import { createPage } from "@/lib/notion";
import { toNotionProperties } from "@/lib/props";

export const runtime = "nodejs";

const slots = ["daily", "monthly", "analysis"] as const;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slot = body.slot as (typeof slots)[number];
    if (!slots.includes(slot)) {
      return NextResponse.json({ error: "Invalid slot." }, { status: 400 });
    }
    const values = body.values || {};
    const dataSourceId = body.dataSourceId || undefined;
    const schema = body.schema || {};
    const properties = toNotionProperties(schema, values);

    const titleProp = Object.values(schema).find((p: any) => p.type === "title");
    if (!titleProp || !properties[titleProp.name]?.title?.length) {
      return NextResponse.json({ error: "제목(Title) 필드는 꼭 입력해주세요." }, { status: 400 });
    }

    const page = await createPage(slot, properties, dataSourceId);
    return NextResponse.json({ ok: true, url: page.url, id: page.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Save failed." }, { status: 500 });
  }
}
