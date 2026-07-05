import { NextResponse } from "next/server";
import { sqlite } from "@/lib/db";

export async function GET() {
  try {
    // Get the most recent decision for each zone using a subquery
    const rows = sqlite.prepare(`
      SELECT d.*
      FROM decisions d
      INNER JOIN (
          SELECT zone, MAX(generated_at) as max_generated_at
          FROM decisions
          GROUP BY zone
      ) as latest
      ON d.zone = latest.zone AND d.generated_at = latest.max_generated_at
    `).all();

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("Failed to fetch latest decisions:", error);
    return NextResponse.json(
      { error: "Failed to fetch latest decisions", details: error.message },
      { status: 500 }
    );
  }
}
