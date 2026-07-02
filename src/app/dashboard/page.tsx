export default function DashboardPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-cp-8">
      <div className="bg-cp-bg-surface border border-cp-border-subtle rounded-cp-md p-cp-6 max-w-md text-center shadow-cp-sm">
        <h1 className="text-cp-h1 font-medium text-cp-text-primary mb-cp-3">
          Dashboard
        </h1>
        <p className="text-cp-body text-cp-text-secondary mb-cp-4">
          The operational dashboard will be built in Phase 4-5, including
          zone-level risk map, agent activity timeline, and what-if simulation
          controls.
        </p>
        <span className="inline-flex items-center gap-cp-2 px-cp-3 py-cp-1 rounded-cp-full bg-cp-risk-medium-bg">
          <span className="w-1.5 h-1.5 rounded-cp-full bg-cp-risk-medium" />
          <span className="text-cp-micro font-medium text-cp-risk-medium">
            Phase 4-5
          </span>
        </span>
      </div>
    </main>
  );
}
