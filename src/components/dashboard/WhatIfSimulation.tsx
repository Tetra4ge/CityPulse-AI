"use client";

import { useState } from "react";
import type { WhatIfResult } from "@/lib/types/agent-schemas";

export function WhatIfSimulation() {
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [zone, setZone] = useState<string>("Zone-A");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WhatIfResult | null>(null);

  const handleSimulate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/whatif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zone, traffic_multiplier: multiplier })
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-cp-bg-surface border border-cp-border-subtle p-cp-4 h-full flex flex-col font-mono text-sm">
      <h2 className="text-cp-text-primary font-bold mb-cp-4 uppercase tracking-widest text-xs border-b border-cp-border-subtle pb-2">What-If Simulation (GPU)</h2>
      
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-cp-text-secondary text-xs mb-1">Target Zone</label>
          <select 
            className="w-full bg-cp-bg-base border border-cp-border-subtle text-cp-text-primary p-2 text-xs outline-none focus:border-cp-text-secondary"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
          >
            <option value="Zone-A">Zone-A</option>
            <option value="Zone-B">Zone-B</option>
            <option value="Zone-C">Zone-C</option>
            <option value="Zone-D">Zone-D</option>
          </select>
        </div>

        <div>
          <label className="block text-cp-text-secondary text-xs mb-1">Traffic Volume Multiplier: {multiplier.toFixed(1)}x</label>
          <input 
            type="range" 
            min="0.5" 
            max="3.0" 
            step="0.1" 
            value={multiplier}
            onChange={(e) => setMultiplier(parseFloat(e.target.value))}
            className="w-full accent-cp-risk-high"
          />
          <div className="flex justify-between text-[10px] text-cp-text-muted mt-1">
            <span>-50% Traffic</span>
            <span>Baseline</span>
            <span>+200% Traffic</span>
          </div>
        </div>

        <button 
          onClick={handleSimulate}
          disabled={loading}
          className="w-full bg-cp-border-strong hover:bg-cp-text-secondary text-cp-bg-base font-bold uppercase text-xs py-2 px-4 transition-colors disabled:opacity-50"
        >
          {loading ? "Simulating..." : "Run Simulation"}
        </button>
      </div>

      {result && (
        <div className="flex-1 border-t border-cp-border-subtle pt-4 mt-2 overflow-y-auto pr-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-cp-text-primary font-bold text-xs uppercase">Simulation Output</h3>
            <span className="text-cp-text-muted text-[10px] bg-cp-bg-base px-2 py-0.5 rounded border border-cp-border-subtle">
              Latency: <span className="text-cp-risk-low">{result.compute_time_ms}ms</span>
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="bg-cp-bg-base p-2 border border-cp-border-subtle">
              <div className="text-[10px] text-cp-text-muted uppercase mb-1">Adjusted Forecast AQI</div>
              <div className="text-lg text-cp-text-primary font-bold">{result.forecast.predicted_aqi}</div>
              <div className="text-[10px] text-cp-text-secondary italic mt-1">{result.forecast.reasoning}</div>
            </div>

            <div className="bg-cp-bg-base p-2 border border-cp-border-subtle">
              <div className="text-[10px] text-cp-text-muted uppercase mb-1">Simulated Risk Level</div>
              <div className={`text-lg font-bold uppercase ${
                result.decision.risk_level === 'severe' ? 'text-cp-risk-severe' :
                result.decision.risk_level === 'high' ? 'text-cp-risk-high' :
                result.decision.risk_level === 'medium' ? 'text-cp-risk-medium' :
                'text-cp-risk-low'
              }`}>
                {result.decision.risk_level}
              </div>
              <div className="text-[10px] text-cp-text-secondary italic mt-1">{result.decision.rationale}</div>
            </div>
            
            <div className="text-[10px] text-cp-risk-medium text-center border border-cp-risk-medium/30 bg-cp-risk-medium-bg p-1 mt-2">
              Note: This is a hypothetical run and was NOT saved to the decisions database.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
