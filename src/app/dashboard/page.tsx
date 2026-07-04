"use client";

import { useState } from "react";
import { ZoneRiskGrid } from "@/components/dashboard/ZoneRiskGrid";
import { HistoricalTrends } from "@/components/dashboard/HistoricalTrends";
import { AgentTimeline } from "@/components/dashboard/AgentTimeline";
import { WhatIfSimulation } from "@/components/dashboard/WhatIfSimulation";

export default function DashboardPage() {
  const [selectedZone, setSelectedZone] = useState("Zone-A");

  return (
    <main className="min-h-screen bg-cp-bg-base text-cp-text-primary p-cp-4 sm:p-cp-6">
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-3rem)] flex flex-col">
        {/* Header */}
        <header className="mb-cp-6 flex items-center justify-between border-b border-cp-border-subtle pb-4">
          <div>
            <h1 className="text-cp-h1 font-medium font-mono uppercase tracking-widest text-cp-text-primary">
              Mission Control
            </h1>
            <p className="text-cp-micro text-cp-text-secondary font-mono">
              CityPulse AI · Live Multi-Agent Oversight
            </p>
          </div>
          
          <div className="flex items-center gap-cp-6">
            <select 
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="bg-cp-bg-surface border border-cp-border-subtle text-cp-text-primary px-3 py-1 font-mono text-xs outline-none focus:border-cp-text-secondary"
            >
              <option value="Zone-A">Zone-A</option>
              <option value="Zone-B">Zone-B</option>
              <option value="Zone-C">Zone-C</option>
              <option value="Zone-D">Zone-D</option>
            </select>

            <span className="flex items-center gap-2 px-3 py-1 bg-cp-risk-low-bg border border-cp-risk-low/30 font-mono text-xs text-cp-risk-low uppercase">
              <span className="w-2 h-2 rounded-full bg-cp-risk-low animate-pulse" />
              System Online
            </span>
          </div>
        </header>

        {/* Main Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-cp-4 min-h-0">
          
          {/* Left Column: Risk & Trends */}
          <div className="lg:col-span-4 flex flex-col gap-cp-4 min-h-0">
            <div className="flex-1 min-h-0">
              <ZoneRiskGrid />
            </div>
            <div className="h-64 shrink-0">
              <HistoricalTrends zone={selectedZone} />
            </div>
          </div>

          {/* Middle Column: Agent Timeline */}
          <div className="lg:col-span-4 min-h-0">
            <AgentTimeline zone={selectedZone} />
          </div>

          {/* Right Column: What-If Simulation */}
          <div className="lg:col-span-4 min-h-0">
            <WhatIfSimulation zone={selectedZone} />
          </div>
          
        </div>
      </div>
    </main>
  );
}
