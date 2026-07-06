"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [selectedZone, setSelectedZone] = useState("Delhi");
  const [isLocating, setIsLocating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customCoords, setCustomCoords] = useState<{ lat: number, lng: number } | null>(null);

  const handleUseMyLocation = () => {
    setIsLocating(true);
    setIsProcessing(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCustomCoords({ lat, lng });
          setSelectedZone("Custom");
          
          try {
            await fetch(`/api/orchestrator/run?zone=Custom&lat=${lat}&lng=${lng}`);
            router.push(`/dashboard?zone=Custom&lat=${lat}&lng=${lng}`);
          } catch (error) {
            console.error("Auto-trigger failed:", error);
            setIsProcessing(false);
            setIsLocating(false);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Failed to get location. Please allow location access.");
          setIsLocating(false);
          setIsProcessing(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setIsLocating(false);
      setIsProcessing(false);
    }
  };

  const handleZoneChange = async (newZone: string) => {
    setSelectedZone(newZone);
    setIsProcessing(true);
    
    try {
      await fetch(`/api/orchestrator/run?zone=${newZone}`);
      router.push(`/dashboard?zone=${newZone}`);
    } catch (error) {
      console.error("Auto-trigger failed:", error);
      setIsProcessing(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col bg-cp-bg-base min-h-screen overflow-y-auto text-cp-text-primary selection:bg-cp-accent-primary selection:text-cp-bg-base">

      {/* 1. HERO SECTION */}
      <section className="relative w-full border-b border-cp-border-default bg-cp-bg-surface flex flex-col items-center justify-center py-cp-16 px-cp-8 min-h-[80vh]">
        <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row items-center gap-cp-12">

          <div className="flex-1 space-y-cp-6">
            <div className="inline-block px-cp-3 py-cp-1 border border-cp-accent-primary text-cp-accent-primary text-cp-micro font-mono uppercase bg-cp-accent-primary/10 animate-pulse">
              System Online :: v1.0.0-rc
            </div>

            <h1 className="text-4xl md:text-6xl font-mono uppercase font-bold text-cp-text-primary tracking-tighter leading-tight">
              CityPulse AI <br />
              <span className="text-cp-accent-primary">Urban Defense Grid</span>
            </h1>

            <p className="text-cp-h2 font-sans text-cp-text-secondary max-w-xl leading-relaxed">
              An autonomous, multi-agent intelligence platform designed to protect urban populations from environmental health risks in real-time.
            </p>

            <div className="flex flex-col xl:flex-row gap-cp-4 pt-cp-4 w-full">
              <Link
                href="/dashboard"
                className="flex-1 sm:flex-none px-cp-8 h-12 border border-cp-accent-primary bg-cp-accent-primary text-cp-bg-base font-mono font-bold uppercase transition-all hover:bg-cp-accent-primary-hover hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] text-center flex items-center justify-center whitespace-nowrap"
              >
                Dashboard 
              </Link>

              <div className="flex flex-col sm:flex-row items-stretch gap-2 flex-1 w-full">
                <div className="flex items-stretch gap-2 flex-1 sm:flex-none">
                  <div className="relative flex-1 sm:flex-none w-full sm:w-auto">
                    {isProcessing && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-cp-bg-surface border border-cp-border-strong text-cp-accent-primary font-mono text-xs uppercase animate-pulse h-12">
                        ⏳ Processing...
                      </div>
                    )}
                    <select
                      value={selectedZone}
                      onChange={(e) => handleZoneChange(e.target.value)}
                      disabled={isProcessing}
                      className="w-full bg-cp-bg-base border border-cp-border-strong text-cp-text-primary pl-4 pr-12 h-12 font-mono uppercase outline-none focus:border-cp-text-muted hover:bg-cp-bg-surface-raised cursor-pointer transition-colors appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23a1a1aa%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1em_1em] disabled:opacity-50"
                    >
                      <option value="Delhi">Delhi</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Bangalore">Bangalore</option>
                      <option value="New York">New York</option>
                      <option value="London">London</option>
                      <option value="Tokyo">Tokyo</option>
                      {customCoords && <option value="Custom">📍 Custom</option>}
                    </select>
                  </div>

                  <button
                    onClick={handleUseMyLocation}
                    disabled={isLocating || isProcessing}
                    className="px-6 border border-cp-border-strong bg-cp-bg-base text-cp-text-primary hover:border-cp-text-muted hover:bg-cp-bg-surface-raised transition-colors disabled:opacity-50 flex items-center justify-center h-12"
                    title="Use My Current Location"
                  >
                    {isLocating ? "⏳" : "LIVE"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full border border-cp-border-default bg-[#0A0E14] p-cp-6 shadow-[0_0_30px_rgba(45,212,191,0.05)]">
            <h3 className="text-cp-small font-mono text-cp-text-secondary border-b border-cp-border-subtle pb-cp-2 mb-cp-4 uppercase">Terminal Activity</h3>
            <div className="space-y-3 text-cp-body font-mono text-cp-text-muted">
              <p> Booting Multi-Agent orchestrator...</p>
              <p> Loading environmental prediction models...</p>
              <p> Establishing CUDA GPU connections... <span className="text-cp-risk-low">SUCCESS</span></p>
              <p> Ingestion Agent active: <span className="text-cp-risk-medium">Monitoring AQI</span></p>
              <p> Triage Agent active: <span className="text-cp-risk-medium">Parsing citizen signals</span></p>
              <p> DB Cache TTL Engine initialized <span className="text-cp-risk-low">(10 min ruleset)</span>.</p>
              <p className="animate-pulse"> Awaiting zone selection for live analysis...</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHAT IS THIS? */}
      <section className="w-full py-cp-16 px-cp-8 bg-cp-bg-base">
        <div className="max-w-6xl mx-auto">
          <div className="border-l-4 border-cp-accent-primary pl-cp-6 mb-cp-12">
            <h2 className="text-cp-display font-mono uppercase text-cp-text-primary tracking-tight">What is this?</h2>
            <p className="text-cp-h3 text-cp-text-secondary font-mono mt-cp-2">The Multi-Agent Urban Defense Grid</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-cp-8 mt-cp-8">
            <div className="border border-cp-border-default bg-cp-bg-surface p-cp-6 hover:border-cp-accent-primary transition-colors">
              <h3 className="text-cp-h2 font-mono text-cp-accent-primary uppercase mb-cp-4">1. Robust Gemini Integration</h3>
              <p className="text-cp-small font-sans text-cp-text-secondary leading-relaxed">
                The entire intelligence layer is powered by <strong>Google Gemini 2.0 Flash</strong>. Crucially, the AI integration utilizes a resilient <em>lazy-loading architecture</em> that prevents Next.js caching bugs, ensuring environment variables always resolve perfectly at runtime.
              </p>
            </div>
            <div className="border border-cp-border-default bg-cp-bg-surface p-cp-6 hover:border-cp-risk-medium transition-colors">
              <h3 className="text-cp-h2 font-mono text-cp-risk-medium uppercase mb-cp-4">2. Agent Swarm via LangGraph</h3>
              <p className="text-cp-small font-sans text-cp-text-secondary leading-relaxed">
                The <strong>Ingestion</strong> and <strong>Triage</strong> agents actively monitor city APIs. <strong>Forecast</strong> predicts the future, while <strong>Decision</strong> and <strong>Reflection</strong> synthesize mitigation plans in a strict LangGraph state machine.
              </p>
            </div>
            <div className="border border-cp-border-default bg-cp-bg-surface p-cp-6 hover:border-cp-risk-high transition-colors">
              <h3 className="text-cp-h2 font-mono text-cp-risk-high uppercase mb-cp-4">3. HITL Architecture</h3>
              <p className="text-cp-small font-sans text-cp-text-secondary leading-relaxed">
                The system features a strict <strong>Human-in-the-Loop (HITL)</strong> checkpoint. High-risk decisions are paused and sent to the dashboard's <em>Approval Queue</em> for human oversight. If rejected, a <strong>Learning Agent</strong> extracts new behavioral rules for future use!
              </p>
            </div>
            <div className="border border-cp-border-default bg-cp-bg-surface p-cp-6 hover:border-cp-risk-severe transition-colors">
              <h3 className="text-cp-h2 font-mono text-cp-risk-severe uppercase mb-cp-4">4. GPU What-If Simulations</h3>
              <p className="text-cp-small font-sans text-cp-text-secondary leading-relaxed">
                City officials can execute <strong>"What-If" simulations</strong> directly from Mission Control. Backed by <em>cuDF</em> and <em>cuML</em> on Nvidia hardware, traffic changes can be simulated in milliseconds, generating fully revised AI decisions instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHY THIS? */}
      <section className="w-full py-cp-16 px-cp-8 bg-cp-bg-surface border-y border-cp-border-default">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-cp-12 items-center">
          <div className="flex-1">
            <div className="border-l-4 border-cp-risk-high pl-cp-6 mb-cp-8">
              <h2 className="text-cp-display font-mono uppercase text-cp-text-primary tracking-tight">Why this?</h2>
              <p className="text-cp-h3 text-cp-text-secondary font-mono mt-cp-2">The Urban Health Crisis</p>
            </div>
            <div className="space-y-cp-6 text-cp-body font-sans text-cp-text-secondary leading-relaxed">
              <p>
                Cities are growing rapidly, and with them, environmental risks like severe air pollution, heatwaves, and localized chemical hazards. Traditional dashboards only show what has <em>already</em> happened.
              </p>
              <p>
                City officials are overwhelmed by data. When AQI spikes to hazardous levels, they don't just need a red line on a chart—they need to know exactly which schools to close, which hospitals to alert, and how to route emergency services.
              </p>
              <p className="text-cp-text-primary font-medium">
                CityPulse AI was built to solve the paralysis of analysis. It doesn't just show data; it actively simulates the future and drafts the exact mitigation plans needed to save lives.
              </p>
            </div>
          </div>
          <div className="flex-1 w-full flex justify-center">
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="border border-cp-border-default bg-cp-bg-base p-6 text-center">
                <div className="text-cp-data-lg text-cp-risk-severe font-mono">420+</div>
                <div className="text-cp-micro text-cp-text-muted font-mono uppercase mt-2">Hazardous AQI Events</div>
              </div>
              <div className="border border-cp-border-default bg-cp-bg-base p-6 text-center">
                <div className="text-cp-data-lg text-cp-risk-high font-mono">1.2M</div>
                <div className="text-cp-micro text-cp-text-muted font-mono uppercase mt-2">Citizens at Risk</div>
              </div>
              <div className="border border-cp-border-default bg-cp-bg-base p-6 text-center col-span-2">
                <div className="text-cp-data-lg text-cp-text-primary font-mono">0.0s</div>
                <div className="text-cp-micro text-cp-text-muted font-mono uppercase mt-2">Delay in AI Mitigation Response</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW WE SOLVE THIS */}
      <section className="w-full py-cp-16 px-cp-8 bg-cp-bg-base mb-cp-16">
        <div className="max-w-6xl mx-auto">
          <div className="border-l-4 border-cp-risk-low pl-cp-6 mb-cp-12">
            <h2 className="text-cp-display font-mono uppercase text-cp-text-primary tracking-tight">How we solve it</h2>
            <p className="text-cp-h3 text-cp-text-secondary font-mono mt-cp-2">Deep Tech & GPU Acceleration</p>
          </div>

          <div className="bg-cp-bg-surface border border-cp-border-default p-cp-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-cp-12">
              <div>
                <h3 className="text-cp-h1 font-mono uppercase text-cp-text-primary mb-cp-4">Nvidia CUDA Backend</h3>
                <p className="text-cp-body font-sans text-cp-text-secondary leading-relaxed mb-cp-6">
                  While the agents make decisions, they rely on a high-performance Python FastAPI backend. This service utilizes GPU-accelerated Pandas (cuDF) to run massive Monte Carlo simulations and "What-If" scenarios in milliseconds.
                </p>
                <div className="bg-[#0A0E14] border border-cp-border-subtle p-cp-4 font-mono text-cp-small text-cp-text-muted">
                  <span className="text-cp-accent-primary">POST</span> /api/v1/simulate<br />
                  <span className="text-cp-risk-low">200 OK</span> - 45.2ms<br />
                  GPU Memory: 4.2GB / 24GB<br />
                  500,000 rows processed.
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <div className="border-l border-cp-border-subtle pl-cp-6 space-y-cp-6">
                  <div>
                    <h4 className="text-cp-h3 font-mono text-cp-text-primary uppercase">1. Real-time Ingestion</h4>
                    <p className="text-cp-micro font-sans text-cp-text-secondary mt-1">Connecting directly to IoT sensors and citizen reporting APIs.</p>
                  </div>
                  <div>
                    <h4 className="text-cp-h3 font-mono text-cp-text-primary uppercase">2. Predictive Modeling</h4>
                    <p className="text-cp-micro font-sans text-cp-text-secondary mt-1">Forecasting AQI drift based on wind, traffic, and industrial output.</p>
                  </div>
                  <div>
                    <h4 className="text-cp-h3 font-mono text-cp-text-primary uppercase">3. Autonomous Action</h4>
                    <p className="text-cp-micro font-sans text-cp-text-secondary mt-1">Drafting emergency orders, dispatching medical alerts, and rerouting traffic.</p>
                  </div>
                  <div>
                    <h4 className="text-cp-h3 font-mono text-cp-text-primary uppercase">4. Smart Caching Layer</h4>
                    <p className="text-cp-micro font-sans text-cp-text-secondary mt-1">Dynamic 10-minute DB cache prevents redundant LangGraph triggers while maintaining strict real-time accuracy.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cp-border-default bg-cp-bg-surface py-cp-8 text-center font-mono text-cp-micro text-cp-text-muted uppercase">
        CityPulse AI © 2026 — Built by team <a href="https://github.com/Tetra4ge" target="_blank" rel="noopener noreferrer" className="text-cp-accent-primary hover:underline transition-all">TetraFourge</a> for the Gen AI APAC Hackathon
      </footer>

    </main>
  );
}
