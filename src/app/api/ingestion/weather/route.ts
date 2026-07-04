import { NextRequest, NextResponse } from "next/server";
import { queryWeatherHistory } from "@/lib/db/bigquery-client";
import { ingestWithRetry } from "@/lib/agents/ingestion-agent";

export async function GET(request: NextRequest) {
  try {
    const zone = request.nextUrl.searchParams.get("zone") || undefined;
    const data = await queryWeatherHistory(zone);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "QUERY_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let zone = "Zone-A";
    try {
      const body = await request.json();
      if (body?.zone) {
        zone = body.zone;
      }
    } catch {
      const paramZone = request.nextUrl.searchParams.get("zone");
      if (paramZone) {
        zone = paramZone;
      }
    }

    const result = await ingestWithRetry("weather", zone);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "INGESTION_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}
