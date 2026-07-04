"use client";

import { useEffect, useState } from "react";

type TrendData = {
  timestamp: string;
  aqi: number;
};

export function HistoricalTrends({ zone }: { zone: string }) {
  const [data, setData] = useState<TrendData[]>([]);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(`/api/ingestion/history?zone=${zone}`);
        if (res.ok) {
          const fetchedData = await res.json();
          if (fetchedData && fetchedData.length > 0) {
            setData(fetchedData);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to fetch history:", e);
      }
      
      // Fallback if DB is empty: just set an empty array.
      setData([]);
    }
    
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [zone]);

  const maxAqi = Math.max(...data.map(d => d.aqi), 300);

  return (
    <div className="bg-cp-bg-surface border border-cp-border-subtle p-cp-4 h-full flex flex-col font-mono text-sm">
      <h2 className="text-cp-text-primary font-bold mb-cp-4 uppercase tracking-widest text-xs border-b border-cp-border-subtle pb-2">24H AQI Trend</h2>
      
      <div className="flex-1 flex items-end gap-1 mt-4 relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-cp-text-muted opacity-50 z-10 pointer-events-none">
          <span>{Math.round(maxAqi)}</span>
          <span>{Math.round(maxAqi / 2)}</span>
          <span>0</span>
        </div>

        {/* Grid lines */}
        <div className="absolute left-0 right-0 top-0 border-b border-cp-border-subtle opacity-20" />
        <div className="absolute left-0 right-0 top-1/2 border-b border-cp-border-subtle opacity-20" />
        <div className="absolute left-0 right-0 bottom-0 border-b border-cp-border-subtle opacity-20" />

        {/* Bars */}
        {data.map((d, i) => {
          const heightPct = (d.aqi / maxAqi) * 100;
          
          let colorClass = "bg-cp-risk-low";
          if (d.aqi > 200) colorClass = "bg-cp-risk-severe";
          else if (d.aqi > 150) colorClass = "bg-cp-risk-high";
          else if (d.aqi > 100) colorClass = "bg-cp-risk-medium";

          return (
            <div 
              key={i} 
              className="flex-1 flex flex-col justify-end group relative"
            >
              <div 
                className={`w-full ${colorClass} opacity-80 group-hover:opacity-100 transition-opacity`} 
                style={{ height: `${heightPct}%` }}
              />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-cp-bg-surface border border-cp-border-subtle px-1 text-[10px] hidden group-hover:block z-20 text-cp-text-primary whitespace-nowrap">
                {Math.round(d.aqi)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
