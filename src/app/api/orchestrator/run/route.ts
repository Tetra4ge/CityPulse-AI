import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/orchestrator";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    // Optional: Get the zone from query params, otherwise default to "Delhi"
    const { searchParams } = new URL(request.url);
    const zone = searchParams.get("zone") || "Delhi";
    
    // Optional: Get lat and lng from query params for custom locations
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const lat = latParam ? parseFloat(latParam) : null;
    const lng = lngParam ? parseFloat(lngParam) : null;

    // Generate a unique Thread ID for the LangGraph checkpointer
    const threadId = crypto.randomUUID();

    console.log(`[API] Triggering LangGraph orchestrator for zone: ${zone}, thread: ${threadId}`);
    
    // Invoke the entire Multi-Agent LangGraph flow
    const finalState = await runPipeline(zone, threadId, lat, lng);

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
