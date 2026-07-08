import { NextResponse } from "next/server";

export async function GET() {
  try {
    const gpuServiceUrl = process.env.NEXT_PUBLIC_GPU_SERVICE_URL || process.env.GPU_SERVICE_URL || "http://127.0.0.1:8000";
    const apiKey = process.env.GPU_SERVICE_API_KEY || "";
    
    const res = await fetch(`${gpuServiceUrl}/benchmark`, { 
      cache: 'no-store',
      headers: {
        "x-api-key": apiKey
      }
    });
    
    if (!res.ok) {
      throw new Error(`GPU service responded with status: ${res.status}`);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Benchmark API failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch benchmark results", details: error.message },
      { status: 500 }
    );
  }
}
