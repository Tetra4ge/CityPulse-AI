"use client";

import { useState } from "react";
import Link from "next/link";
import { ZoneRiskGrid } from "@/components/dashboard/ZoneRiskGrid";
import { HistoricalTrends } from "@/components/dashboard/HistoricalTrends";
import { AgentTimeline } from "@/components/dashboard/AgentTimeline";
import { WhatIfSimulation } from "@/components/dashboard/WhatIfSimulation";
import { ApprovalQueue } from "@/components/dashboard/ApprovalQueue";
import { AccelerationBenchmark } from "@/components/dashboard/AccelerationBenchmark";

export default function DashboardPage() {
  const [selectedZone, setSelectedZone] = useState("Delhi");

  return (
    <main className="h-screen overflow-hidden bg-cp-bg-base text-cp-text-primary p-cp-4 sm:p-cp-6">
      <div className="max-w-[1600px] mx-auto h-full flex flex-col">
        {/* Header */}
        <header className="mb-cp-6 flex items-center justify-between border-b border-cp-border-subtle pb-4">
          <div className="flex items-center gap-cp-4">
            <Link 
              href="/" 
              className="text-cp-text-secondary hover:text-cp-accent-primary transition-colors flex items-center justify-center p-2 border border-transparent hover:border-cp-border-subtle rounded bg-cp-bg-surface-raised"
              title="Return to Core"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
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
              <span className="text-cp-text-secondary text-xs uppercase tracking-widest font-mono">Location:</span>
              <select 
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-cp-bg-surface border border-cp-border-subtle text-cp-text-primary px-3 py-1 font-mono text-xs outline-none focus:border-cp-text-secondary"
              >
                <option value="Delhi">Delhi</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Bangalore">Bangalore</option>
                <option value="New York">New York</option>
                <option value="London">London</option>
                <option value="Tokyo">Tokyo</option>
                <option disabled>──────────</option>
                <option value="Zone-A">Zone-A (Delhi Central)</option>
                <option value="Zone-B">Zone-B (Delhi West)</option>
              </select>
            </div>

            <span className="flex items-center gap-2 px-3 py-1 bg-cp-risk-low-bg border border-cp-risk-low/30 font-mono text-xs text-cp-risk-low uppercase">
              <span className="w-2 h-2 rounded-full bg-cp-risk-low animate-pulse" />
              System Online
            </span>
          </div>
        </header>

        {/* Main Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-cp-4 min-h-0">
          
          {/* Left Column: Risk & Trends */}
          <div className="lg:col-span-3 flex flex-col gap-cp-4 min-h-0">
            <div className="flex-1 min-h-0">
              <ZoneRiskGrid />
            </div>
            <div className="h-64 shrink-0">
              <HistoricalTrends zone={selectedZone} />
            </div>
          </div>

          {/* Middle Column: Agent Timeline */}
          <div className="lg:col-span-6 min-h-0 flex flex-col gap-cp-4">
            <ApprovalQueue />
            <div className="flex-1 min-h-0">
              <AgentTimeline zone={selectedZone} />
            </div>
          </div>

          {/* Right Column: What-If Simulation & Benchmark */}
          <div className="lg:col-span-3 min-h-0 flex flex-col gap-cp-4">
            <div className="flex-1 min-h-0">
              <WhatIfSimulation zone={selectedZone} />
            </div>
            <div className="h-64 shrink-0">
              <AccelerationBenchmark />
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}
