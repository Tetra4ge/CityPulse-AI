"use client";

import { useEffect, useState } from "react";
import type { TimelineEntry } from "@/lib/types/agent-schemas";

export function AgentTimeline() {
  const [events, setEvents] = useState<TimelineEntry[]>([]);

  useEffect(() => {
    async function fetchTimeline() {
      try {
        const res = await fetch("/api/timeline?limit=15");
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    fetchTimeline();
    const interval = setInterval(fetchTimeline, 5000); // Poll every 5s for the demo
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-cp-bg-surface border border-cp-border-subtle p-cp-4 h-full flex flex-col font-mono text-sm overflow-hidden">
      <h2 className="text-cp-text-primary font-bold mb-cp-4 uppercase tracking-widest text-xs border-b border-cp-border-subtle pb-2">Agent Activity Log</h2>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {events.map((evt) => (
          <div key={evt.id} className="relative pl-4 border-l border-cp-border-subtle">
            {/* Timeline node */}
            <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-cp-border-strong" />
            
            <div className="flex justify-between items-start mb-1">
              <span className="text-cp-text-primary font-bold uppercase text-xs">
                {evt.agent_name}
              </span>
              <span className="text-cp-text-muted text-[10px]">
                {new Date(evt.timestamp).toLocaleTimeString()}
              </span>
            </div>
            
            <p className="text-cp-text-secondary text-xs">
              {evt.action}
            </p>
            
            {/* Badges for conflict/escalation */}
            {(evt.conflict_flag || evt.escalation_flag) && (
              <div className="mt-2 flex gap-2">
                {evt.conflict_flag && (
                  <span className="inline-block px-1.5 py-0.5 bg-cp-risk-high-bg text-cp-risk-high text-[10px] uppercase font-bold border border-cp-risk-high/30">
                    Conflict Detected
                  </span>
                )}
                {evt.escalation_flag && (
                  <span className="inline-block px-1.5 py-0.5 bg-cp-risk-severe-bg text-cp-risk-severe text-[10px] uppercase font-bold border border-cp-risk-severe/30">
                    Escalation Required
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
        {events.length === 0 && (
          <div className="text-cp-text-muted text-xs italic">Awaiting agent activity...</div>
        )}
      </div>
    </div>
  );
}
