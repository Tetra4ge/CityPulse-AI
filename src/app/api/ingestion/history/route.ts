import { NextRequest, NextResponse } from "next/server";
import { sqlite } from "@/lib/db";

export async function GET(request: NextRequest) {
  const zone = request.nextUrl.searchParams.get("zone") || "Zone-A";

  try {
    // Fetch last 24 readings for the zone
    const records = sqlite
      .prepare("SELECT timestamp, aqi_value as aqi FROM aqi_history WHERE zone = ? ORDER BY timestamp DESC LIMIT 24")
      .all(zone) as { timestamp: string; aqi: number }[];

    // If no records found, return empty array so UI knows it's empty
    if (!records || records.length === 0) {
      return NextResponse.json([]);
    }

    // The query orders DESC (newest first) to get the latest 24, but a chart needs it ASC (oldest to newest left to right)
    const sortedRecords = records.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return NextResponse.json(sortedRecords);
  } catch (error: any) {
    console.error("Failed to fetch AQI history:", error);
    return NextResponse.json(
      { error: "Database error", details: error.message },
      { status: 500 }
    );
  }
}
