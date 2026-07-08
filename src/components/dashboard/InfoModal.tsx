import { useEffect, useRef } from "react";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InfoModal({ isOpen, onClose }: InfoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        ref={modalRef}
        className="w-full max-w-3xl bg-cp-bg-surface border border-cp-accent-primary/50 shadow-[0_0_30px_rgba(45,212,191,0.1)] p-cp-6 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex justify-between items-center mb-cp-6 border-b border-cp-border-subtle pb-cp-4">
          <h2 className="text-cp-h2 font-mono text-cp-accent-primary uppercase tracking-widest flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            System Guide :: Mission Control
          </h2>
          <button 
            onClick={onClose}
            className="text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-surface-raised p-1 transition-colors border border-transparent hover:border-cp-border-subtle"
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="space-y-cp-8 text-cp-body text-cp-text-secondary font-sans leading-relaxed">
          <section>
            <h3 className="text-cp-large font-mono text-cp-text-primary mb-cp-2 uppercase border-l-2 border-cp-text-muted pl-3">What is this project?</h3>
            <p className="pl-3">
              <strong className="text-cp-accent-primary">CityPulse AI</strong> is an autonomous, multi-agent urban defense grid. It constantly ingests real-time environmental data (AQI, weather) and citizen reports to detect urban crises. When a high-risk event occurs, LangGraph agents coordinate to forecast drift, generate mitigation strategies, draft emergency notifications, and await your human-in-the-loop approval.
            </p>
          </section>

          <section>
            <h3 className="text-cp-large font-mono text-cp-text-primary mb-cp-4 uppercase border-l-2 border-cp-text-muted pl-3">Dashboard Modules</h3>
            <div className="space-y-cp-4 pl-3">
              <div className="border border-cp-border-default bg-cp-bg-base p-4 hover:border-cp-risk-low transition-colors">
                <strong className="text-cp-risk-low font-mono block mb-1 uppercase tracking-wider text-sm">1. Zone Selection (Top Right)</strong>
                Select a zone or use your GPS location to instantly trigger the AI swarm to analyze that specific area.
              </div>
              
              <div className="border border-cp-border-default bg-cp-bg-base p-4 hover:border-cp-risk-medium transition-colors">
                <strong className="text-cp-risk-medium font-mono block mb-1 uppercase tracking-wider text-sm">2. Risk Grid & Trends (Left)</strong>
                Displays real-time critical metrics (AQI, temperature, conflict signals). The chart plots the last 24 hours of air quality to visualize environmental drift.
              </div>

              <div className="border border-cp-border-default bg-cp-bg-base p-4 hover:border-cp-risk-high transition-colors">
                <strong className="text-cp-risk-high font-mono block mb-1 uppercase tracking-wider text-sm">3. Approval Queue (Center)</strong>
                The Human-in-the-Loop core. AI mitigation plans land here for review. <span className="text-cp-text-primary font-medium">Approve</span> to dispatch alerts, or <span className="text-cp-text-primary font-medium">Reject</span> with notes so the Learning Agent can extract new rules for future scenarios!
              </div>

              <div className="border border-cp-border-default bg-cp-bg-base p-4 hover:border-cp-risk-severe transition-colors">
                <strong className="text-cp-risk-severe font-mono block mb-1 uppercase tracking-wider text-sm">4. GPU What-If Simulation (Right)</strong>
                Adjust hypothetical traffic levels. When triggered, the backend runs cuDF/cuML (NVIDIA RAPIDS) accelerated models to predict AQI changes and generate a completely new mitigation plan instantly.
              </div>

              <div className="border border-cp-border-default bg-cp-bg-base p-4 hover:border-cp-accent-primary transition-colors">
                <strong className="text-cp-accent-primary font-mono block mb-1 uppercase tracking-wider text-sm">5. Agent Timeline (Bottom)</strong>
                An audit trail of the LangGraph state machine. Watch the Ingestion, Triage, Forecast, Decision, and Reflection agents coordinate in real-time.
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
