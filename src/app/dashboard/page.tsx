"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ZoneRiskGrid } from "@/components/dashboard/ZoneRiskGrid";
import { HistoricalTrends } from "@/components/dashboard/HistoricalTrends";
import { AgentTimeline } from "@/components/dashboard/AgentTimeline";
import { WhatIfSimulation } from "@/components/dashboard/WhatIfSimulation";
import { ApprovalQueue } from "@/components/dashboard/ApprovalQueue";
import { AccelerationBenchmark } from "@/components/dashboard/AccelerationBenchmark";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedZone, setSelectedZone] = useState("Delhi");
  const [isLocating, setIsLocating] = useState(false);
  const [customCoords, setCustomCoords] = useState<{lat: number, lng: number} | null>(null);

  // Sync state whenever URL parameters change
  useEffect(() => {
    const zone = searchParams.get("zone");
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");

    if (latStr && lngStr) {
      setCustomCoords({ lat: parseFloat(latStr), lng: parseFloat(lngStr) });
    } else {
      setCustomCoords(null);
    }

    if (zone) {
      setSelectedZone(zone);
    }
  }, [searchParams]);

  const handleUseMyLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          try {
            await fetch(`/api/orchestrator/run?zone=Custom&lat=${lat}&lng=${lng}`);
            // Explicitly route to update URL
            router.push(`/dashboard?zone=Custom&lat=${lat}&lng=${lng}`);
          } catch (error) {
            console.error("Auto-trigger failed:", error);
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Failed to get location. Please allow location access.");
          setIsLocating(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setIsLocating(false);
    }
  };

  const handleZoneChange = async (newZone: string) => {
    setIsLocating(true);
    
    try {
      await fetch(`/api/orchestrator/run?zone=${newZone}`);
      // Push new route without lat/lng params so we don't carry over custom coords to standard cities
      router.push(`/dashboard?zone=${newZone}`);
    } catch (error) {
      console.error("Auto-trigger failed:", error);
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <main className="min-h-screen bg-cp-bg-base text-cp-text-primary p-cp-4 sm:p-cp-6">
      <div className="max-w-[1600px] mx-auto h-full flex flex-col">
        {/* Header */}
        <header className="mb-cp-6 flex items-center justify-between border-b border-cp-border-subtle pb-4">
          <div className="flex items-center gap-cp-4">
            <Link 
              href="/" 
              className="text-cp-text-secondary hover:text-cp-accent-primary transition-colors flex items-center gap-2 px-3 py-2 border border-transparent hover:border-cp-border-subtle rounded bg-cp-bg-surface-raised font-mono text-xs uppercase tracking-widest"
              title="Return to Core"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Home
            </Link>
            <div>
              <h1 className="text-cp-h1 font-medium font-mono uppercase tracking-widest text-cp-text-primary">
                Mission Control
              </h1>
              <p className="text-cp-micro text-cp-text-secondary font-mono">
                CityPulse AI · Live Multi-Agent Oversight
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-cp-6">
            <div className="flex items-center gap-2">
              <span className="text-cp-text-secondary text-xs uppercase tracking-widest font-mono">
                {isLocating ? "⏳ Processing..." : "Location:"}
              </span>
              <select 
                value={selectedZone}
                onChange={(e) => handleZoneChange(e.target.value)}
                disabled={isLocating}
                className="bg-cp-bg-surface border border-cp-border-subtle text-cp-text-primary px-3 py-1 font-mono text-xs outline-none focus:border-cp-text-secondary disabled:opacity-50"
              >
                <option value="Delhi">Delhi</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Bangalore">Bangalore</option>
                <option value="New York">New York</option>
                <option value="London">London</option>
                <option value="Tokyo">Tokyo</option>
                {(customCoords || selectedZone === "Custom") && <option value="Custom">📍 Custom</option>}
                <option disabled>──────────</option>
                <option value="Zone-A">Zone-A (Delhi Central)</option>
                <option value="Zone-B">Zone-B (Delhi West)</option>
              </select>
              <button
                  onClick={handleUseMyLocation}
                  disabled={isLocating}
                  className="px-2 py-1 border border-cp-border-subtle bg-cp-bg-surface text-cp-text-primary hover:border-cp-text-muted transition-colors disabled:opacity-50 text-xs"
                  title="Use My Current Location"
                >
                  {isLocating ? "⏳" : "📍"}
              </button>
            </div>

            <span className="flex items-center gap-2 px-3 py-1 bg-cp-risk-low-bg border border-cp-risk-low/30 font-mono text-xs text-cp-risk-low uppercase">
              <span className="w-2 h-2 rounded-full bg-cp-risk-low animate-pulse" />
              System Online
            </span>
          </div>
        </header>

        {/* Main Grid - Row 1 (Top section) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-cp-4 mb-cp-4">
          
          {/* Left Column: Risk & Trends */}
          <div className="lg:col-span-4 flex flex-col gap-cp-4">
            <div>
              <ZoneRiskGrid />
            </div>
            <div className="h-64">
              <HistoricalTrends zone={selectedZone} />
            </div>
          </div>

          {/* Middle Column: Approval Queue */}
          <div className="lg:col-span-4 flex flex-col gap-cp-4">
            <div className="flex-1">
              <ApprovalQueue />
            </div>
          </div>

          {/* Right Column: What-If Simulation & Benchmark */}
          <div className="lg:col-span-4 flex flex-col gap-cp-4">
            <div>
              <WhatIfSimulation zone={selectedZone} />
            </div>
            <div className="h-64">
              <AccelerationBenchmark />
            </div>
          </div>
          
        </div>

        {/* Main Grid - Row 2 (Bottom section, Full Width) */}
        <div className="flex-1 min-h-[350px]">
          <AgentTimeline zone={selectedZone} />
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cp-bg-base flex flex-col items-center justify-center">
        <div className="text-cp-accent-primary font-mono animate-pulse">⏳ Initializing Mission Control...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
