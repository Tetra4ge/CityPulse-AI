const http = require('http');

console.log("=========================================");
console.log("🔥 CITYPULSE AI - CRISIS REPLAY MODE 🔥");
console.log("=========================================\n");
console.log("Injecting a simulated industrial incident into 'Zone-A'...");
console.log("Judges: Watch the dashboard to see the Agent Pipeline react live.\n");

const TARGET_ZONE = "Zone-A";

// The timeline of our simulated crisis
const events = [
  { timeOffset: 0, aqi: 120, label: "T+0s: Moderate baseline." },
  { timeOffset: 5000, aqi: 180, label: "T+5s: Spike detected. Triage sees citizens coughing." },
  { timeOffset: 10000, aqi: 250, label: "T+10s: Severe spike. Decision Agent detects conflict and escalates." },
  { timeOffset: 15000, aqi: 310, label: "T+15s: Hazardous. Reflection Agent flags for human review." }
];

events.forEach(event => {
  setTimeout(() => {
    console.log(`[Replay] ${event.label} (AQI: ${event.aqi})`);
    
    // We hit the AQI ingestion API with an override to force the pipeline to run
    http.get(`http://localhost:3000/api/ingestion/aqi?zone=${encodeURIComponent(TARGET_ZONE)}&aqi_override=${event.aqi}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`   └─ Pipeline triggered successfully. Check the UI!`);
        } else {
          console.error(`   └─ Error triggering pipeline:`, data);
        }
      });
    }).on('error', (err) => {
      console.error(`   └─ HTTP Error:`, err.message);
    });

  }, event.timeOffset);
});
