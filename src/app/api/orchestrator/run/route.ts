import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/orchestrator";

export async function GET(request: NextRequest) {
  try {
    // Optional: Get the zone from query params, otherwise default to "Delhi"
    const { searchParams } = new URL(request.url);
    const zone = searchParams.get("zone") || "Delhi";

    console.log(`[API] Triggering LangGraph orchestrator for zone: ${zone}`);
    
    // Invoke the entire Multi-Agent LangGraph flow
    const finalState = await runPipeline(zone);

    return NextResponse.json({
      success: true,
      message: `LangGraph pipeline executed successfully for ${zone}`,
      data: finalState,
    });
  } catch (error: any) {
    console.error("[API] Orchestrator failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Unknown error occurred" },
      { status: 500 }
    );
  }
}
