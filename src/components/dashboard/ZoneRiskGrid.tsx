"use client";

import { useEffect, useState } from "react";

type ZoneData = {
  zone: string;
  risk_level: "low" | "medium" | "high" | "severe";
  overall_confidence: number;
};

export function ZoneRiskGrid() {
  const [zones, setZones] = useState<ZoneData[]>([]);

  useEffect(() => {
    // In a real app we might fetch `/api/decision` or similar to get current risk map.
    // For now we'll fetch pending approvals or just a mock overview since we only have one API for decisions
    // Let's use pending approvals to get the latest state of each zone
    async function fetchZones() {
      try {
        const res = await fetch("/api/approval/pending");
        if (!res.ok) return;
        const data = await res.json();
        
        // Extract unique zones from pending decisions
        const uniqueZones = new Map<string, ZoneData>();
        data.forEach((item: any) => {
          if (!uniqueZones.has(item.decision.zone)) {
            uniqueZones.set(item.decision.zone, {
              zone: item.decision.zone,
              risk_level: item.decision.risk_level,
              overall_confidence: item.decision.overall_confidence
            });
          }
        });

        // Add defaults if empty just for the demo
        if (uniqueZones.size === 0) {
          uniqueZones.set("Zone-A", { zone: "Zone-A", risk_level: "low", overall_confidence: 0.9 });
          uniqueZones.set("Zone-B", { zone: "Zone-B", risk_level: "medium", overall_confidence: 0.85 });
          uniqueZones.set("Zone-C", { zone: "Zone-C", risk_level: "high", overall_confidence: 0.75 });
          uniqueZones.set("Zone-D", { zone: "Zone-D", risk_level: "severe", overall_confidence: 0.65 });
        }

        setZones(Array.from(uniqueZones.values()));
      } catch (e) {
        console.error(e);
      }
    }
    fetchZones();
  }, []);

  return (
    <div className="bg-cp-bg-surface border border-cp-border-subtle p-cp-4 h-full flex flex-col font-mono text-sm">
      <h2 className="text-cp-text-primary font-bold mb-cp-4 uppercase tracking-widest text-xs border-b border-cp-border-subtle pb-2">Active Zone Risk Grid</h2>
      
      <div className="grid grid-cols-2 gap-cp-4 flex-1">
        {zones.map((z) => (
          <div 
            key={z.zone} 
            className="flex flex-col justify-center items-center p-cp-4 border border-cp-border-subtle bg-cp-bg-surface relative overflow-hidden"
          >
            {/* Risk Accent Border */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
              z.risk_level === 'severe' ? 'bg-cp-risk-severe' :
              z.risk_level === 'high' ? 'bg-cp-risk-high' :
              z.risk_level === 'medium' ? 'bg-cp-risk-medium' :
              'bg-cp-risk-low'
            }`} />
            
            <div className="text-cp-text-secondary text-xs mb-1 uppercase tracking-wider">{z.zone}</div>
            <div className={`text-xl font-bold ${
              z.risk_level === 'severe' ? 'text-cp-risk-severe' :
              z.risk_level === 'high' ? 'text-cp-risk-high' :
              z.risk_level === 'medium' ? 'text-cp-risk-medium' :
              'text-cp-risk-low'
            }`}>
              {z.risk_level.toUpperCase()}
            </div>
            <div className="text-cp-text-muted text-[10px] mt-2">
              CONF: {(z.overall_confidence * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
