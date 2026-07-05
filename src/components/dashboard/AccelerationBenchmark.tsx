"use client";

import { useState, useEffect } from "react";

interface BenchmarkResult {
  pandas_ms: number;
  cudf_ms: number;
  speedup: number;
  dataset_size: number;
  last_run: string;
  computed_on_gpu: boolean;
}

export function AccelerationBenchmark() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BenchmarkResult | null>(null);

  const fetchBenchmark = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/benchmark");
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

  useEffect(() => {
    fetchBenchmark();
  }, []);

  return (
    <div className="bg-cp-bg-surface border border-cp-border-subtle p-cp-4 h-full flex flex-col font-mono text-sm">
      <div className="flex justify-between items-center mb-cp-4 border-b border-cp-border-subtle pb-2">
        <h2 className="text-cp-text-primary font-bold uppercase tracking-widest text-xs">Acceleration Benchmark</h2>
        <button 
          onClick={fetchBenchmark}
          disabled={loading}
          className="bg-cp-bg-base border border-cp-border-subtle hover:bg-cp-text-secondary hover:text-cp-bg-base px-2 py-1 text-[10px] uppercase transition-colors"
        >
          {loading ? "Running..." : "Rerun Test"}
        </button>
      </div>

      {!result && loading && (
        <div className="flex-1 flex items-center justify-center text-cp-text-muted">
          Running 50k-row stress test...
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between text-xs text-cp-text-secondary border border-cp-border-subtle p-2 bg-cp-bg-base">
            <span>Dataset: <span className="text-cp-text-primary">{result.dataset_size.toLocaleString()} rows</span></span>
            <span>GPU Active: <span className={result.computed_on_gpu ? "text-cp-risk-medium" : "text-cp-risk-low"}>{result.computed_on_gpu ? "YES" : "NO"}</span></span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-cp-bg-base border border-cp-border-subtle p-3 flex flex-col items-center">
              <span className="text-[10px] uppercase text-cp-text-muted mb-1 text-center">CPU (pandas + sklearn)</span>
              <span className="text-lg font-bold text-cp-text-primary">{result.pandas_ms.toFixed(0)} ms</span>
            </div>
            
            <div className="bg-cp-bg-base border border-cp-risk-medium/50 p-3 flex flex-col items-center shadow-[inset_0_0_10px_rgba(234,179,8,0.1)]">
              <span className="text-[10px] uppercase text-cp-risk-medium mb-1 text-center">GPU (cudf + cuml)</span>
              <span className="text-lg font-bold text-cp-risk-medium">{result.cudf_ms.toFixed(0)} ms</span>
            </div>
          </div>

          <div className="mt-2 text-center flex flex-col items-center gap-2">
            <div>
              <span className="text-2xl font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">{result.speedup.toFixed(1)}x</span>
              <span className="text-emerald-400 text-xs uppercase ml-2 tracking-widest drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">Speedup</span>
            </div>
            <div className="text-[10px] text-cp-text-secondary bg-cp-bg-base border border-cp-border-subtle px-3 py-1 mt-1">
              * This proves the {result.speedup.toFixed(1)}x faster "What-If" interactivity.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
