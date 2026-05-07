export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { hand, season = "2026" } = req.query;

  if (!hand || !["L", "R"].includes(hand.toUpperCase())) {
    return res.status(400).json({ error: "hand parameter required: L or R" });
  }

  const side = hand.toUpperCase();

  try {
    // Savant batter splits vs LHP or RHP
    const url = `https://baseballsavant.mlb.com/leaderboard/custom?year=${season}&type=batter&filter=&sort=xwoba&sortDir=desc&min=10&selections=xba,xslg,xwoba,xwobacon,exit_velocity_avg,barrel_batted_rate,hard_hit_percent,batting_avg,slg_percent,on_base_percent&splits=batter_pitcher_hand_${side === "L" ? "LHP" : "RHP"}&csv=true`;

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!response.ok) return res.status(response.status).json({ error: "Baseball Savant request failed" });

    const csv = await response.text();
    const lines = csv.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
    const rows = lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/"/g, ""));
      return Object.fromEntries(headers.map((h, i) => [h, vals[i]]));
    });

    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ error: "Request failed", details: err.message });
  }
}
