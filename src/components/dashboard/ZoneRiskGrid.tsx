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
        const res = await fetch("/api/decision/latest");
        if (!res.ok) return;
        const data = await res.json();
        
        // Extract unique zones from latest decisions
        const uniqueZones = new Map<string, ZoneData>();
        data.forEach((item: any) => {
          if (!uniqueZones.has(item.zone)) {
            uniqueZones.set(item.zone, {
              zone: item.zone,
              risk_level: item.risk_level,
              overall_confidence: item.overall_confidence
            });
          }
        });

        setZones(Array.from(uniqueZones.values()));
      } catch (e) {
        console.error(e);
      }
    }
    fetchZones();
  }, []);

  return (
    <div className="bg-cp-bg-surface border border-cp-border-subtle p-cp-4 h-full flex flex-col font-mono text-sm">
      <h2 className="text-cp-text-primary font-bold mb-cp-4 uppercase tracking-widest text-xs border-b border-cp-border-subtle pb-2">Active Location Risk Grid</h2>
      
      <div className="flex-1 grid grid-cols-2 gap-cp-4 overflow-y-auto pr-2">
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
            
            <div className="text-cp-text-secondary text-[10px] uppercase">Location:</div>
            <div className="text-cp-text-primary font-bold mb-1">{z.zone}</div>
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
