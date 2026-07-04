/**
 * CityPulse AI — Global System Thresholds
 *
 * This file centralizes all threshold logic to satisfy architectural requirements (Fix 6).
 * 
 * AQI Breakpoints are sourced from the US Environmental Protection Agency (EPA) standards:
 * - 0 to 50: Good
 * - 51 to 100: Moderate
 * - 101 to 150: Unhealthy for Sensitive Groups
 * - 151 to 200: Unhealthy
 * - 201 to 300: Very Unhealthy
 * - 301+: Hazardous
 */

// We map the EPA scale to our 4-tier risk system (0=Low, 1=Medium, 2=High, 3=Severe)
export function getEpaForecastTier(predictedAqi: number): number {
  if (predictedAqi <= 50) return 0;       // Low (EPA Good)
  if (predictedAqi <= 100) return 1;      // Medium (EPA Moderate)
  if (predictedAqi <= 150) return 2;      // High (EPA Unhealthy for Sensitive Groups)
  return 3;                               // Severe (EPA Unhealthy / Hazardous)
}

// Minimum confidence [0.0 - 1.0] below which the Reflection Agent will flag a decision for human review.
// We set this to 0.75 as it requires a high degree of confidence (75%) from both the Triage ground-truth 
// and the Forecast prediction before allowing an unflagged pass.
export const CONFIDENCE_CUTOFF = 0.75;

// The amount of divergence between Forecast Risk Tier and Triage Severity Tier needed to trigger a conflict.
// We set this to 1, meaning if Forecast says 'Low' (0) and Triage says 'High' (2), the difference is 2 > 1, 
// so a conflict is detected. If they are adjacent (0 and 1), they are considered to be in agreement.
export const CONFLICT_DIVERGENCE_THRESHOLD = 1;
