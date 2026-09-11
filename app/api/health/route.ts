import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: {
      daily: Boolean(process.env.NOTION_DAILY_DATA_SOURCE_ID),
      monthly: Boolean(process.env.NOTION_MONTHLY_DATA_SOURCE_ID),
      analysis: Boolean(process.env.NOTION_ANALYSIS_DATA_SOURCE_ID),
    },
  });
}
