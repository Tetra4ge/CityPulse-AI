"use client";

import { useEffect, useState } from "react";
import type { ApprovalPendingItem, ForecastOutput, TriageOutput } from "@/lib/types/agent-schemas";

// Extend the interface to include the new dynamic property
interface ExtendedApprovalItem extends ApprovalPendingItem {
  underlying_signals?: {
    forecast: ForecastOutput;
    triage: TriageOutput;
  }
}

export function ApprovalQueue() {
  const [pendingItems, setPendingItems] = useState<ExtendedApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [rejectFeedback, setRejectFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    // Update 'now' every second for the escalation timer
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchPending = async () => {
    try {
      const res = await fetch("/api/approval/pending");
      if (res.ok) {
        const data = await res.json();
        setPendingItems(data);
      }
    } catch (err) {
      console.error("Failed to fetch pending approvals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (decisionId: string, approved: boolean) => {
    setProcessing(decisionId);
    try {
      // 1. Submit Approval/Rejection
      const res = await fetch("/api/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision_id: decisionId,
          approved,
          reviewer_id: "human_reviewer_01",
          notes: approved ? "Approved for immediate dispatch" : (rejectFeedback[decisionId] || "Rejected by human oversight"),
        }),
      });

      if (!res.ok) throw new Error("Approval submission failed");

      // 2. If approved, trigger Notification Dispatch automatically
      if (approved) {
        const dispatchRes = await fetch("/api/notification/dispatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision_id: decisionId }),
        });
        if (!dispatchRes.ok) throw new Error("Dispatch failed");
      }

      // Remove from queue
      setPendingItems((prev) => prev.filter((i) => i.decision.id !== decisionId));
    } catch (err) {
      console.error(err);
      alert("Failed to process approval.");
    } finally {
      setProcessing(null);
    }
  };

  if (loading && pendingItems.length === 0) return null;

  if (pendingItems.length === 0) {
    return (
      <div className="bg-cp-bg-surface border border-cp-border-subtle p-cp-4 font-mono text-sm">
        <h2 className="text-cp-text-primary font-bold mb-cp-2 uppercase tracking-widest text-xs border-b border-cp-border-subtle pb-2">Human Approval Queue</h2>
        <div className="text-cp-text-secondary text-xs italic py-4 text-center">No pending decisions require human review.</div>
      </div>
    );
  }

  return (
    <div className="bg-cp-bg-surface border border-cp-risk-high p-cp-4 font-mono text-sm relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-cp-risk-high animate-pulse" />
      <h2 className="text-cp-text-primary font-bold mb-cp-4 uppercase tracking-widest text-xs border-b border-cp-border-subtle pb-2 flex justify-between items-center">
        <span>Action Required: Human Approval Queue</span>
        <span className="bg-cp-risk-high text-cp-bg-base px-2 py-0.5 rounded-full">{pendingItems.length} Pending</span>
      </h2>
      
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {/* Tier 2.2: Escalation sort. Unapproved severe items older than 30s go to the top */}
        {[...pendingItems].sort((a, b) => {
          const aAge = now - new Date(a.decision.generated_at).getTime();
          const bAge = now - new Date(b.decision.generated_at).getTime();
          const aEscalated = a.decision.risk_level === 'severe' && aAge > 30000 ? 1 : 0;
          const bEscalated = b.decision.risk_level === 'severe' && bAge > 30000 ? 1 : 0;
          return bEscalated - aEscalated;
        }).map((item) => {
          
          const ageMs = now - new Date(item.decision.generated_at).getTime();
          const isEscalated = item.decision.risk_level === 'severe' && ageMs > 30000;
          const lowConfidence = item.decision.overall_confidence < 0.75;

          return (
          <div 
            key={item.decision.id} 
            className={`border bg-cp-bg-base p-3 flex flex-col gap-3 transition-all duration-500
              ${isEscalated ? 'border-cp-risk-severe animate-pulse shadow-[0_0_15px_rgba(255,51,102,0.5)]' : 'border-cp-border-subtle'}
              ${lowConfidence ? 'opacity-80 border-dashed' : ''}
            `}
          >
            {/* Tier 2.2: Escalation Warning */}
            {isEscalated && (
              <div className="bg-cp-risk-severe text-cp-bg-base text-[10px] font-bold uppercase text-center py-1 animate-pulse">
                ESCALATION WARNING: DECISION PENDING {Math.floor(ageMs / 1000)}s
              </div>
            )}
            
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-cp-text-secondary text-[10px] uppercase block mb-1">Target Location</span>
                <span className="text-cp-text-primary font-bold">{item.decision.zone}</span>
              </div>
              <div className="text-right">
                <span className="text-cp-text-secondary text-[10px] uppercase block mb-1">Risk Level</span>
                <span className={`font-bold uppercase ${
                  item.decision.risk_level === 'severe' ? 'text-cp-risk-severe' :
                  item.decision.risk_level === 'high' ? 'text-cp-risk-high' :
                  item.decision.risk_level === 'medium' ? 'text-cp-risk-medium' :
                  'text-cp-risk-low'
                }`}>
                  {item.decision.risk_level}
                </span>
              </div>
            </div>

            {/* Tier 1.2: Confidence Visuals */}
            {lowConfidence && (
              <div className="text-[10px] text-cp-risk-high uppercase font-bold border border-dashed border-cp-risk-high p-1 text-center">
                Low Confidence Warning ({(item.decision.overall_confidence * 100).toFixed(0)}%)
              </div>
            )}

            {/* Tier 1.3: "Why this and not that" Conflict View */}
            {item.decision.conflict_detected && item.underlying_signals && (
              <div className="grid grid-cols-2 gap-2 text-xs border border-cp-risk-high/30 p-2 bg-cp-bg-surface">
                <div className="border-r border-cp-border-subtle pr-2">
                  <span className="text-cp-text-secondary text-[10px] uppercase block mb-1">Forecast Agent</span>
                  <div className="text-cp-text-primary">Predicted AQI: <span className="font-bold">{item.underlying_signals.forecast.predicted_aqi.toFixed(1)}</span></div>
                </div>
                <div className="pl-2">
                  <span className="text-cp-text-secondary text-[10px] uppercase block mb-1">Triage Agent</span>
                  <div className="text-cp-text-primary">Severity: <span className="font-bold uppercase text-cp-risk-high">{item.underlying_signals.triage.severity_signal}</span></div>
                  <div className="text-cp-text-primary mt-1 text-[10px] italic">{item.underlying_signals.triage.summary}</div>
                </div>
              </div>
            )}

            {/* Rationale */}
            <div>
              <span className="text-cp-text-secondary text-[10px] uppercase block mb-1">Decision Rationale</span>
              <p className="text-cp-text-primary text-xs leading-relaxed">{item.decision.rationale}</p>
            </div>

            {/* Reflection Flags */}
            <div className="bg-cp-risk-medium-bg border border-cp-risk-medium/30 p-2">
              <span className="text-cp-risk-medium text-[10px] uppercase font-bold block mb-1">Reflection Agent Flags</span>
              <ul className="list-disc list-inside text-cp-text-primary text-xs">
                {item.reflection.flags.map((flag, idx) => (
                  <li key={idx} className="capitalize">{flag.replace(/_/g, " ")}</li>
                ))}
              </ul>
            </div>

            {/* Explainability Trace */}
            {item.decision.trace_report && (
              <div className="bg-cp-bg-surface border border-cp-border-subtle p-2">
                <span className="text-cp-accent-primary text-[10px] uppercase font-bold block mb-1">AI Explainability Trace</span>
                <p className="text-cp-text-primary text-xs leading-relaxed italic border-l-2 border-cp-accent-primary pl-2">{item.decision.trace_report}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 mt-2">
              <textarea 
                placeholder="Optional feedback (required for rejection to teach the AI)" 
                className="bg-cp-bg-base border border-cp-border-subtle p-2 text-[10px] w-full resize-none h-12 text-cp-text-primary outline-none focus:border-cp-text-secondary"
                value={rejectFeedback[item.decision.id] || ""}
                onChange={e => setRejectFeedback({...rejectFeedback, [item.decision.id]: e.target.value})}
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => handleAction(item.decision.id, true)}
                  disabled={processing === item.decision.id}
                  className="flex-1 bg-cp-risk-low hover:bg-opacity-80 text-cp-bg-base font-bold text-xs py-2 transition-colors uppercase tracking-wider disabled:opacity-50"
                >
                  {processing === item.decision.id ? "Processing..." : "Approve"}
                </button>
                <button 
                  onClick={() => handleAction(item.decision.id, false)}
                  disabled={processing === item.decision.id || !rejectFeedback[item.decision.id]}
                  className="flex-1 bg-transparent border border-cp-risk-severe text-cp-risk-severe hover:bg-cp-risk-severe hover:text-cp-bg-base font-bold text-xs py-2 transition-colors uppercase tracking-wider disabled:opacity-50"
                  title={!rejectFeedback[item.decision.id] ? "Provide feedback to reject" : ""}
                >
                  Reject
                </button>
              </div>
            </div>

          </div>
          );
        })}
      </div>
    </div>
  );
}
