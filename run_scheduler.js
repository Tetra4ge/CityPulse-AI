const http = require('http');

// The cities we want to monitor
const ZONES = ["Delhi", "Mumbai", "New York", "London", "Tokyo"];

// For a real production app, this would be 3600000 (1 hour). 
// For a hackathon demo, you might want it faster (e.g., 60000 for 1 minute).
const POLL_INTERVAL_MS = 60 * 60 * 1000; // 1 Hour

console.log(`[CityPulse Scheduler] Starting automated ingestion...`);
console.log(`[CityPulse Scheduler] Polling every ${POLL_INTERVAL_MS / 1000} seconds.`);

function fetchZoneData(zone) {
  // 1. Fetch Weather
  http.get(`http://localhost:3000/api/ingestion/weather?zone=${encodeURIComponent(zone)}`, (res) => {
    if (res.statusCode === 200) {
      console.log(`[${new Date().toLocaleTimeString()}] ✅ Weather updated for ${zone}`);
    } else {
      console.log(`[${new Date().toLocaleTimeString()}] ❌ Weather failed for ${zone}`);
    }
  }).on('error', () => {});

  // 2. Fetch AQI
  http.get(`http://localhost:3000/api/ingestion/aqi?zone=${encodeURIComponent(zone)}`, (res) => {
    if (res.statusCode === 200) {
      console.log(`[${new Date().toLocaleTimeString()}] ✅ AQI updated for ${zone}`);
    } else {
      console.log(`[${new Date().toLocaleTimeString()}] ❌ AQI failed for ${zone}`);
    }
  }).on('error', () => {});
}

// Run immediately on start
ZONES.forEach(fetchZoneData);

// Then run on the interval
setInterval(() => {
  ZONES.forEach(fetchZoneData);
}, POLL_INTERVAL_MS);
