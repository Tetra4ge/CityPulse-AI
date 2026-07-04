import { NextRequest, NextResponse } from "next/server";
import { queryComplaintsHistory, insertComplaint } from "@/lib/db/bigquery-client";
import type { IngestionOutput, CitizenReportRequest } from "@/lib/types/agent-schemas";

export async function GET(request: NextRequest) {
  try {
    const zone = request.nextUrl.searchParams.get("zone") || undefined;
    const since = request.nextUrl.searchParams.get("since") || undefined;
    const data = await queryComplaintsHistory(zone, since);
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
    const body = (await request.json()) as CitizenReportRequest;
    
    if (!body.zone || !body.text) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Missing required fields: zone, text" } },
        { status: 400 }
      );
    }

    const record: IngestionOutput = {
      source: "citizen_reports",
      zone: body.zone,
      timestamp: body.timestamp || new Date().toISOString(),
      payload: {
        raw_text: body.text,
        category: "other",
        severity: "medium",
        is_simulated: true,
      },
      status: "ok",
      confidence_penalty: 0.0,
    };

    await insertComplaint(record);
    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "CREATION_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}
