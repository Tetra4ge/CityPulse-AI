const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(process.cwd(), 'sqlite.db');
const db = new Database(dbPath);

const zones = ["Zone-A", "Zone-B", "Delhi", "Mumbai", "New York", "London", "Tokyo", "Bangalore"];

const insertAqi = db.prepare(`
  INSERT INTO aqi_history (id, zone, timestamp, aqi_value, source_status, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

let count = 0;

for (const zone of zones) {
  // Generate 24 hours of data
  const now = Date.now();
  for (let i = 24; i >= 1; i--) {
    const timestamp = new Date(now - i * 3600000).toISOString();
    
    // Create a realistic-looking sine wave AQI pattern between 50 and 180
    const baseAqi = 100;
    const amplitude = 50;
    const randomNoise = Math.random() * 20 - 10;
    
    // Different phase shift for different zones so they don't look identical
    const phaseShift = zone.length; 
    
    let aqiValue = baseAqi + Math.sin((i + phaseShift) * 0.5) * amplitude + randomNoise;
    aqiValue = Math.max(10, Math.min(300, aqiValue)); // clamp

    insertAqi.run(
      crypto.randomUUID(),
      zone,
      timestamp,
      aqiValue,
      'ok',
      timestamp
    );
    count++;
  }
}

console.log(`Successfully seeded ${count} historical AQI records (24 per zone).`);
