export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center p-cp-8">
      <div className="max-w-2xl w-full space-y-cp-8 text-center">
        {/* Project identity */}
        <div className="space-y-cp-4">
          <h1 className="text-cp-display font-medium text-cp-text-primary tracking-tight">
            CityPulse AI
          </h1>
          <p className="text-cp-h3 text-cp-text-secondary font-normal max-w-lg mx-auto">
            Multi-agent decision intelligence platform for urban health risk
          </p>
        </div>

        {/* Phase status badge — pill shape, cp-risk-low (green) = healthy/complete */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-cp-2 px-cp-3 py-cp-1 rounded-cp-full bg-cp-risk-low-bg">
            <span className="w-1.5 h-1.5 rounded-cp-full bg-cp-risk-low" />
            <span className="text-cp-micro font-medium text-cp-risk-low">
              Phase 0 — Foundation
            </span>
          </span>
        </div>

        {/* System card */}
        <div className="bg-cp-bg-surface border border-cp-border-subtle rounded-cp-md p-cp-6 text-left shadow-cp-sm">
          <h2 className="text-cp-h2 font-medium text-cp-text-primary mb-cp-4">
            System Status
          </h2>
          <div className="space-y-cp-3">
            <StatusRow label="Project scaffold" status="complete" />
            <StatusRow label="Design token system" status="complete" />
            <StatusRow label="API route stubs" status="complete" />
            <StatusRow label="Database schema (DDL)" status="complete" />
            <StatusRow label="Agent logic" status="pending" phase="Phase 2-3" />
            <StatusRow label="Dashboard UI" status="pending" phase="Phase 4-5" />
            <StatusRow label="GPU acceleration" status="pending" phase="Phase 2" />
          </div>
        </div>

        {/* Links */}
        <div className="flex justify-center gap-cp-4">
          <a
            href="https://github.com"
            className="text-cp-body text-cp-text-secondary hover:text-cp-accent-primary transition-colors duration-150"
          >
            Documentation →
          </a>
          <a
            href="/dashboard"
            className="text-cp-body text-cp-text-secondary hover:text-cp-accent-primary transition-colors duration-150"
          >
            Dashboard →
          </a>
        </div>
      </div>
    </main>
  );
}

function StatusRow({
  label,
  status,
  phase,
}: {
  label: string;
  status: "complete" | "pending";
  phase?: string;
}) {
  const isComplete = status === "complete";
  return (
    <div className="flex items-center justify-between py-cp-1">
      <span className="text-cp-body text-cp-text-secondary">{label}</span>
      <div className="flex items-center gap-cp-2">
        {phase && (
          <span className="text-cp-micro text-cp-text-muted">{phase}</span>
        )}
        <span
          className={`inline-flex items-center gap-cp-1 px-cp-3 py-cp-1 rounded-cp-full text-cp-micro font-medium ${
            isComplete
              ? "bg-cp-risk-low-bg text-cp-risk-low"
              : "bg-cp-risk-medium-bg text-cp-risk-medium"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-cp-full ${
              isComplete ? "bg-cp-risk-low" : "bg-cp-risk-medium"
            }`}
          />
          {isComplete ? "Complete" : "Pending"}
        </span>
      </div>
    </div>
  );
}
