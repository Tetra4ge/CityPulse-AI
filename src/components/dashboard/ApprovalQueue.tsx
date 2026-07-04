"use client";

import { useEffect, useState } from "react";
import type { ApprovalPendingItem } from "@/lib/types/agent-schemas";

export function ApprovalQueue() {
  const [pendingItems, setPendingItems] = useState<ApprovalPendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

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
          notes: approved ? "Approved for immediate dispatch" : "Rejected by human oversight",
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
      
      <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
        {pendingItems.map((item) => (
          <div key={item.decision.id} className="border border-cp-border-subtle bg-cp-bg-base p-3 flex flex-col gap-3">
            
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

            {/* Actions */}
            <div className="flex gap-3 mt-2">
              <button 
                onClick={() => handleAction(item.decision.id, true)}
                disabled={processing === item.decision.id}
                className="flex-1 bg-cp-risk-low hover:bg-opacity-80 text-cp-bg-base font-bold text-xs py-2 transition-colors uppercase tracking-wider disabled:opacity-50"
              >
                {processing === item.decision.id ? "Processing..." : "Approve & Dispatch"}
              </button>
              <button 
                onClick={() => handleAction(item.decision.id, false)}
                disabled={processing === item.decision.id}
                className="flex-1 bg-transparent border border-cp-risk-severe text-cp-risk-severe hover:bg-cp-risk-severe hover:text-cp-bg-base font-bold text-xs py-2 transition-colors uppercase tracking-wider disabled:opacity-50"
              >
                Reject
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
